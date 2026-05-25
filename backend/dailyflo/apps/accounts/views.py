from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from .models import CustomUser
from .social_auth import verify_apple_id_token, verify_google_id_token
from .serializers import (
    UserRegistrationSerializer, SocialAuthSerializer, UserLoginSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer, UserProfileSerializer, 
    UserUpdateSerializer, UserListSerializer
)


def get_tokens_for_user(user):
    """generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)  # create refresh token for user
    return {  # return both tokens as strings
        'refresh': str(refresh),  # long-lived token for getting new access tokens
        'access': str(refresh.access_token),  # short-lived token for API access
    }


class UserRegistrationView(APIView):
    """
    user registration endpoint
    creates new user account with email/password
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)  # validate registration data
        if serializer.is_valid():  # if data is valid
            user = serializer.save()  # create new user in database
            tokens = get_tokens_for_user(user)  # generate JWT tokens for new user
            
            return Response({  # return success response with user data and tokens
                'message': 'User registered successfully',
                'tokens': tokens,  # JWT tokens for immediate login
                'user': UserProfileSerializer(user).data  # user profile data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # return validation errors


class SocialAuthView(APIView):
    """
    social authentication endpoint — verifies google/apple id tokens server-side, then issues dailyflo jwt.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        provider = serializer.validated_data['provider']
        raw_token = serializer.validated_data['id_token']
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')

        try:
            if provider == 'google':
                claims = verify_google_id_token(raw_token)
            else:
                claims = verify_apple_id_token(raw_token)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        provider_user_id = claims['sub']
        raw_email = (claims.get('email') or '').strip()
        # email field is required for uniqueness; apple sometimes omits email — synthetic unique placeholder
        email = raw_email or f'{provider}-{provider_user_id}@social-login.invalid'

        ev_raw = claims.get('email_verified', False)
        if isinstance(ev_raw, str):
            email_verified_bool = ev_raw.lower() in ('true', '1', 'yes')
        else:
            email_verified_bool = bool(ev_raw)

        # conflict only when provider shared a real email (compare apples-to-apples with existing rows)
        if raw_email:
            conflict = CustomUser.objects.filter(email=email).exclude(auth_provider=provider).first()
            if conflict:
                return Response(
                    {
                        'error': 'account_conflict',
                        'message': (
                            f'An account with this email already exists using '
                            f'{conflict.auth_provider}. Please sign in with that method.'
                        ),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        user, created = CustomUser.objects.get_or_create(
            auth_provider=provider,
            auth_provider_id=provider_user_id,
            defaults={
                'email': email,
                'first_name': claims.get('given_name') or first_name,
                'last_name': claims.get('family_name') or last_name,
                'avatar_url': claims.get('picture'),
                'is_email_verified': email_verified_bool,
            },
        )

        tokens = get_tokens_for_user(user)
        return Response(
            {
                'message': f'Authenticated with {provider}',
                'tokens': tokens,
                'user': UserProfileSerializer(user).data,
                'is_new_user': created,
            },
            status=status.HTTP_200_OK,
        )


class UserLoginView(APIView):
    """
    custom user login endpoint
    provides additional validation beyond JWT token endpoint
    """
    # allow any user (authenticated or not) to access this endpoint
    # permissions.AllowAny is a predefined DRF permission class
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)  # validate login credentials
        if serializer.is_valid():  # check if credentials are valid
            user = serializer.validated_data['user']  # get authenticated user
            tokens = get_tokens_for_user(user)  # generate JWT tokens for user
            
            return Response({  # return success response
                'message': 'Login successful',
                'tokens': tokens,  # JWT tokens for API access
                'user': UserProfileSerializer(user).data  # user profile data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # return validation errors


class PasswordChangeView(APIView):
    """
    password change endpoint for authenticated users
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})  # validate password change data
        if serializer.is_valid():  # check if data is valid
            user = request.user  # get current authenticated user
            user.set_password(serializer.validated_data['new_password'])  # set new password (hashed)
            user.save()  # save user with new password
            
            return Response({  # return success response
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # return validation errors


class PasswordResetRequestView(APIView):
    """
    password reset request endpoint
    sends reset email to user
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)  # validate email
        if serializer.is_valid():  # check if email is valid
            email = serializer.validated_data['email']  # get email from request
            user = CustomUser.objects.get(email=email, auth_provider='email')  # find user by email
            
            # generate reset token
            token = default_token_generator.make_token(user)  # create secure reset token
            uid = urlsafe_base64_encode(force_bytes(user.pk))  # encode user ID for URL safety
            
            # TODO: send reset email
            # for now, return token in response (remove in production)
            return Response({  # return success response with reset data
                'message': 'Password reset email sent',
                'reset_token': token,  # remove in production
                'uid': uid  # remove in production
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # return validation errors


class PasswordResetConfirmView(APIView):
    """
    password reset confirmation endpoint
    resets password with token
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)  # validate reset data
        if serializer.is_valid():  # check if data is valid
            # TODO: implement token validation and password reset
            return Response({  # return success response
                'message': 'Password reset successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # return validation errors


class UserProfileView(APIView):
    """
    get current user's profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)  # serialize current user data
        return Response(serializer.data, status=status.HTTP_200_OK)  # return user profile data


class UserProfileUpdateView(UpdateAPIView):
    """
    update current user's profile
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserUpdateSerializer
    
    def get_object(self):
        return self.request.user  # return current authenticated user
    
    def perform_update(self, serializer):
        """override to customize update response"""
        serializer.save()  # save the validated data to database
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)  # allow partial updates (PATCH)
        instance = self.get_object()  # get current user instance
        serializer = self.get_serializer(instance, data=request.data, partial=partial)  # create serializer with user data
        serializer.is_valid(raise_exception=True)  # validate data, raise exception if invalid
        self.perform_update(serializer)  # save validated data to database
        
        return Response({  # return custom success response
            'message': 'Profile updated successfully',
            'user': UserProfileSerializer(instance).data  # include updated user data
        }, status=status.HTTP_200_OK)


class UserListView(ListAPIView):
    """
    list all users (admin only)
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserListSerializer
    queryset = CustomUser.objects.filter(soft_deleted=False)
    
    def get_queryset(self):
        queryset = super().get_queryset()  # get base queryset (non-deleted users)
        
        # add filtering options
        auth_provider = self.request.query_params.get('auth_provider')  # get auth provider filter
        if auth_provider:  # if provider filter provided
            queryset = queryset.filter(auth_provider=auth_provider)  # filter by provider
        
        is_verified = self.request.query_params.get('is_verified')  # get verification filter
        if is_verified is not None:  # if verification filter provided
            queryset = queryset.filter(is_email_verified=is_verified.lower() == 'true')  # filter by verification status
        
        return queryset  # return filtered queryset


class UserDetailView(RetrieveAPIView):
    """
    get specific user details (admin only)
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserListSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        return CustomUser.objects.filter(soft_deleted=False)  # return only non-deleted users


class UserDeactivateView(APIView):
    """
    deactivate user account (admin only)
    """
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id, soft_deleted=False)  # find user by ID (not deleted)
        
        # prevent admin from deactivating themselves
        if user == request.user:  # check if admin is trying to deactivate themselves
            return Response({  # return error response
                'error': 'Cannot deactivate your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.soft_deleted = True  # mark user as soft deleted
        user.is_active = False  # deactivate user account
        user.save()  # save changes to database
        
        return Response({  # return success response
            'message': f'User {user.email} has been deactivated'
        }, status=status.HTTP_200_OK)
