from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings
import uuid
import secrets
from datetime import timedelta
from django.contrib.auth.hashers import check_password


class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('admin', 'Administrator'),
        ('business', 'Business Owner'),
        ('client', 'Client'))
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='client')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    password_reset_token = models.CharField(max_length=64, blank=True, null=True)
    password_reset_sent_at = models.DateTimeField(blank=True, null=True)
    last_password_hash = models.CharField(max_length=128, blank=True, null=True)
    

    def __str__(self):
        return self.username
    

    def generate_verification_token(self):
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_sent_at = timezone.now()
        self.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
        return self.email_verification_token
    

    def is_verification_token_valid(self):
        if not self.email_verification_sent_at:
            return False
        expiry_time = self.email_verification_sent_at + timedelta(hours=getattr(settings, 'EMAIL_VERIFICATION_TIMEOUT', 24))
        return timezone.now() < expiry_time
    
    def verify_email(self):
        self.is_email_verified = True
        self.email_verification_token = None
        self.email_verification_sent_at = None
        self.save(update_fields=['is_email_verified', 'email_verification_token', 'email_verification_sent_at'])


    def generate_password_reset_token(self):
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_sent_at = timezone.now()
        self.save(update_fields=['password_reset_token', 'password_reset_sent_at'])
        return self.password_reset_token
    

    def is_password_reset_token_valid(self):
        if not self.password_reset_sent_at:
            return False
        expiry_time = self.password_reset_sent_at + timedelta(hours=getattr(settings, 'PASSWORD_RESET_TIMEOUT', 1))
        return timezone.now() < expiry_time
    

    def clear_password_reset_token(self):
        self.password_reset_token = None
        self.password_reset_sent_at = None
        self.save(update_fields=['password_reset_token', 'password_reset_sent_at'])
    

    def save_password_history(self, new_password_hash):
        if self.password:  # Only save if user already has a password
            self.last_password_hash = self.password
        
    def is_password_reused(self, new_password):
        if not self.last_password_hash:
            return False
        return check_password(new_password, self.last_password_hash)
    
    
    def set_password(self, raw_password):
        if self.password:
            self.last_password_hash = self.password
        super().set_password(raw_password)
        if self.password_reset_token:
            self.clear_password_reset_token()