from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer

def get_tokens_for_user(user):
    refreshToken = RefreshToken.for_user(user)
    return{
        'return': refreshToken,
        'access': refreshToken.access_token,
    }

class UserRegistrationView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid(): #is_valid() calls vlaidation methods in serializer
            user = serializer.save() # calls create methods in serializer
            tokens = get_tokens_for_user(user)     
            return Response({
                'message': 'User registered successfully.',
                'tokens': tokens,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'display_name': user.display_name,
                    'bio': user.bio,
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

