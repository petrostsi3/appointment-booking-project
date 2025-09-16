from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, UserProfileView, UserTypeView, UserViewSet, change_password,
    EmailVerificationView, ResendVerificationEmailView, CheckVerificationStatusView,
    PasswordResetRequestView, PasswordResetConfirmView, PasswordStrengthView)
  
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('user-type/', UserTypeView.as_view(), name='user-type'),
    path('change-password/', change_password, name='change-password'), 
    # Email verification endpoints
    path('verify-email/', EmailVerificationView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('check-verification/', CheckVerificationStatusView.as_view(), name='check-verification'),
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password-strength/', PasswordStrengthView.as_view(), name='password-strength'),
    # router URLs for admin functionality
    path('admin/', include(router.urls)),
]