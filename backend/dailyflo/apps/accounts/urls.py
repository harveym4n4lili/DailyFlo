from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from . import views

# authentication URL patterns
auth_urlpatterns = [
    # jwt token endpoints
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    
    # custom authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('social/', views.SocialAuthView.as_view(), name='social_auth'),
    
    # password management endpoints
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/request/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]

# user profile URL patterns
profile_urlpatterns = [
    # user profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', views.UserProfileUpdateView.as_view(), name='user_profile_update'),
    
    # user management endpoints (admin)
    path('list/', views.UserListView.as_view(), name='user_list'),
    path('<uuid:user_id>/', views.UserDetailView.as_view(), name='user_detail'),
    path('<uuid:user_id>/deactivate/', views.UserDeactivateView.as_view(), name='user_deactivate'),
]

# main URL patterns
urlpatterns = [
    # authentication endpoints
    path('auth/', include(auth_urlpatterns)),
    
    # user profile endpoints
    path('users/', include(profile_urlpatterns)),
]