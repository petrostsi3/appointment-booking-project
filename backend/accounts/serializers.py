from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password
from .validators import validate_password_strength
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'first_name', 'last_name', 'user_type', 'password', 'password2']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'username': {'required': True}}


    def validate_username(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Username cannot be empty.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value.strip()


    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.strip()


    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("First name is required.")
        return value.strip()


    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Last name is required.")
        return value.strip()


    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        password = attrs['password']
        username = attrs['username']
        validation_result = validate_password_strength(password, username)
        if not validation_result['is_valid']:
            raise serializers.ValidationError({"password": validation_result['errors']})
        return attrs


    def create(self, validated_data):
        logger.info(f"Creating user with data: {validated_data}")
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data.get('phone_number', ''),
                user_type=validated_data.get('user_type', 'client'),
                password=validated_data['password'],
                is_active=False)  # Set inactive until email verification
            logger.info(f"User created successfully: {user.username}")
            return user
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")
            raise


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True)
            self.context['user'] = user
            return value
        except User.DoesNotExist:
            return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=64)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        token = attrs['token']
        new_password = attrs['new_password']
        confirm_password = attrs['confirm_password']
        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            user = User.objects.get(
                password_reset_token=token,
                password_reset_sent_at__isnull=False)
            if not user.is_password_reset_token_valid():
                raise serializers.ValidationError({
                    "token": "Password reset link has expired. Please request a new one."})
            self.context['user'] = user 
        except User.DoesNotExist:
            raise serializers.ValidationError({
                "token": "Invalid password reset link. Please request a new one."})
        validation_result = validate_password_strength(new_password, user.username)
        if not validation_result['is_valid']:
            raise serializers.ValidationError({"new_password": validation_result['errors']})
        if user.is_password_reused(new_password):
            raise serializers.ValidationError({
                "new_password": "You cannot reuse your previous password. Please choose a different password."})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)


    def validate_current_password(self, value):
        user = self.context['request'].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    

    def validate(self, attrs):
        current_password = attrs['current_password']
        new_password = attrs['new_password']
        confirm_password = attrs['confirm_password']
        user = self.context['request'].user
        if new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if current_password == new_password:
            raise serializers.ValidationError({
                "new_password": "New password cannot be the same as your current password."})
        validation_result = validate_password_strength(new_password, user.username)
        if not validation_result['is_valid']:
            raise serializers.ValidationError({"new_password": validation_result['errors']})
        if user.is_password_reused(new_password):
            raise serializers.ValidationError({
                "new_password": "You cannot reuse your previous password. Please choose a different password."})
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'first_name', 'last_name', 
                 'user_type', 'date_joined', 'is_email_verified']
        read_only_fields = ['user_type', 'date_joined', 'is_email_verified']
    

    def validate_username(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Username cannot be empty.")  
        user = self.instance
        if user and User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value.strip()
    

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required.")  
        user = self.instance
        if user and User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.strip()
    

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value.strip()
    

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Last name cannot be empty.")
        return value.strip()
    

    def update(self, instance, validated_data):
        logger.info(f"Updating user profile for: {instance.username}")
        logger.info(f"Update data: {validated_data}")
        if 'email' in validated_data and validated_data['email'] != instance.email:
            instance.is_email_verified = False
            logger.info(f"Email changed for {instance.username}, requiring re-verification")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.save()
            logger.info(f"User profile updated successfully: {instance.username}")
            return instance
        except Exception as e:
            logger.error(f"Failed to update user profile for {instance.username}: {str(e)}")
            raise serializers.ValidationError("Failed to update profile. Please try again.")


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=64)

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()