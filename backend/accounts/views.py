from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .serializers import (
    UserSerializer, UserProfileSerializer, EmailVerificationSerializer, 
    ResendVerificationSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, ChangePasswordSerializer)
from .email_utils import (
    send_verification_email, send_verification_success_email,
    send_password_reset_email)
from .validators import validate_password_strength
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid email address',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email, is_active=True)
            reset_token = user.generate_password_reset_token()
            if send_password_reset_email(user, reset_token):
                logger.info(f"Password reset email sent to: {user.email}")
                message = "If an account with this email exists, a password reset link has been sent."
            else:
                logger.error(f"Failed to send password reset email to: {user.email}")
                message = "If an account with this email exists, a password reset link has been sent."
        except User.DoesNotExist:
            message = "If an account with this email exists, a password reset link has been sent."
            logger.info(f"Password reset requested for non-existent email: {email}")
        return Response({
            'message': message,
            'email_sent': True
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid reset data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = serializer.context['user']
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            user.save()
            logger.info(f"Password reset successful for user: {user.email}")
            return Response({
                'message': 'Password has been reset successfully. You can now log in with your new password.',
                'success': True
            }, status=status.HTTP_200_OK)    
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}")
            return Response({
                'error': 'Password reset failed. Please try again.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response({
            'error': 'Invalid password data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = request.user
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        logger.info(f"Password changed successfully for user: {user.username}")
        return Response({
            'message': 'Password changed successfully.',
            'success': True
        }, status=status.HTTP_200_OK)  
    except Exception as e:
        logger.error(f"Password change failed for user {request.user.username}: {str(e)}")
        return Response({
            'error': 'Failed to change password. Please try again.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordStrengthView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        password = request.data.get('password', '')
        username = request.data.get('username', '')
        if not password:
            return Response({
                'error': 'Password is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        result = validate_password_strength(password, username)
        return Response({
            'is_valid': result['is_valid'],
            'errors': result['errors'],
            'strength_score': result['strength_score'],
            'requirements': result['requirements']
        }, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        logger.info(f"Registration attempt with data: {request.data}")
        try:
            response = super().create(request, *args, **kwargs)
            user = User.objects.get(id=response.data['id'])
            if send_verification_email(user):
                logger.info(f"Verification email sent successfully for user: {user.username}")
                return Response({
                    'message': 'Registration successful! Please check your email to verify your account.',
                    'email': user.email,
                    'verification_sent': True
                }, status=status.HTTP_201_CREATED)
            else:
                logger.warning(f"Registration succeeded but email failed for user: {user.username}")
                return Response({
                    'message': 'Registration successful, but we could not send the verification email. Please try resending it.',
                    'email': user.email,
                    'verification_sent': False,
                    'user_id': user.id
                }, status=status.HTTP_201_CREATED)  
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            return Response({
                'error': 'Registration failed. Please try again.',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid verification data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        token = serializer.validated_data['token']
        try:
            user = User.objects.get(
                email_verification_token=token,
                is_email_verified=False)
            if not user.is_verification_token_valid():
                logger.warning(f"Expired verification token used for user: {user.email}")
                return Response({
                    'error': 'Verification link has expired. Please request a new one.',
                    'expired': True
                }, status=status.HTTP_400_BAD_REQUEST)
            user.verify_email()
            user.is_active = True
            user.save()
            send_verification_success_email(user)
            logger.info(f"Email verified successfully for user: {user.email}")
            return Response({
                'message': 'Email verified successfully! You can now log in to your account.',
                'user': {
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type
                }
            }, status=status.HTTP_200_OK) 
        except User.DoesNotExist:
            logger.warning(f"Invalid verification token attempted: {token}")
            return Response({
                'error': 'Invalid verification link. Please check the link or request a new one.',
                'invalid': True
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Email verification error: {str(e)}")
            return Response({
                'error': 'Verification failed. Please try again.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendVerificationEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid email address',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response({
                    'message': 'This email address is already verified. You can log in to your account.',
                    'already_verified': True
                }, status=status.HTTP_200_OK)
            if send_verification_email(user):
                logger.info(f"Verification email resent to: {user.email}")
                return Response({
                    'message': 'Verification email sent successfully! Please check your inbox.',
                    'email_sent': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to send verification email. Please try again later.',
                    'email_sent': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        
        except User.DoesNotExist:
            return Response({
                'message': 'If an account with this email exists, a verification email has been sent.',
                'email_sent': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Resend verification email error: {str(e)}")
            return Response({
                'error': 'Failed to process request. Please try again.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckVerificationStatusView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                'error': 'Email address is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            return Response({
                'email': user.email,
                'is_verified': user.is_email_verified,
                'is_active': user.is_active
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    

    def retrieve(self, request, *args, **kwargs):
        logger.info(f"Profile retrieval for user: {request.user.username}")
        return super().retrieve(request, *args, **kwargs)
    

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        logger.info(f"Profile update attempt for user: {user.username}")
        logger.info(f"Update data: {request.data}") 
        new_username = request.data.get('username')
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                logger.warning(f"Username change attempt failed - username exists: {new_username}")
                return Response({
                    'username': ['A user with this username already exists.'],
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)
        new_email = request.data.get('email')
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                logger.warning(f"Email change attempt failed - email exists: {new_email}")
                return Response({
                    'email': ['A user with this email already exists.'],
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)
        try:
            response = super().update(request, *args, **kwargs)
            if response.status_code == 200:
                logger.info(f"Profile updated successfully for user: {user.username}")
                logger.info(f"Updated data: {response.data}")
                enhanced_response_data = {
                    **response.data,
                    'message': 'Profile updated successfully!',
                    'success': True}
                return Response(enhanced_response_data, status=status.HTTP_200_OK)
            return response  
        except Exception as e:
            logger.error(f"Profile update failed for user {user.username}: {str(e)}")
            return Response({
                'detail': 'Profile update failed. Please try again.',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    def partial_update(self, request, *args, **kwargs):
        logger.info(f"Partial profile update for user: {request.user.username}")
        return self.update(request, *args, **kwargs)


class UserTypeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, format=None):
        logger.info(f"User type request from user: {request.user.username}")
        return Response({
            'user_type': request.user.user_type,
            'is_admin': request.user.user_type == 'admin',
            'is_business': request.user.user_type == 'business',
            'is_client': request.user.user_type == 'client',})


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'admin'


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileSerializer
        return UserSerializer