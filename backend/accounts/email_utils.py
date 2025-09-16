from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
import logging

logger = logging.getLogger(__name__)


def send_password_reset_email(user, reset_token):
    logger.info(f"Sending password reset email to: {user.email}")
    try:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        context = {
            'user_name': f"{user.first_name} {user.last_name}",
            'username': user.username,
            'reset_url': reset_url,
            'site_name': 'Appointment Booking System',
            'expires_in': '1 hour'}
        subject = '🔐 Password Reset Request - Appointment Booking'
        try:
            html_message = render_to_string('emails/password_reset.html', context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False)
            logger.info(f"Password reset email sent successfully to: {user.email}")
            return True 
        except Exception as template_error:
            logger.warning(f"HTML template failed, sending simple email: {str(template_error)}")
            send_simple_password_reset_email(user, reset_url)
            return True  
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return False


def send_simple_password_reset_email(user, reset_url):
    subject = '🔐 Password Reset Request - Appointment Booking'
    message = f"""
Hello {user.first_name} {user.last_name}!

You have requested a password reset for your Appointment Booking account.

To reset your password, please click the link below:
{reset_url}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

For security reasons:
- Do not share this link with anyone
- This link can only be used once
- If the link expires, you can request a new password reset

Best regards,
The Appointment Booking Team
"""
    send_mail(
        subject=subject,
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False)
    logger.info(f"Fallback password reset email sent to: {user.email}")


def send_password_reset_success_email(user):
    logger.info(f"Sending password reset success email to: {user.email}")
    subject = '✅ Password Reset Successful - Appointment Booking'
    message = f"""
Hello {user.first_name}!

Your password has been successfully reset.

Account Details:
- Username: {user.username}
- Email: {user.email}
- Reset completed: Just now

Security Reminders:
- You can now log in with your new password
- Make sure to keep your password secure
- Consider using a password manager
- If you didn't make this change, contact us immediately

Thank you for keeping your account secure!

Best regards,
The Appointment Booking Team
"""
    try:
        send_mail(
            subject=subject,
            message=message.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False)
        logger.info(f"Password reset success email sent to: {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset success email to {user.email}: {str(e)}")
        return False


def send_verification_email(user):
    logger.info(f"Sending verification email to: {user.email}")
    try:
        token = user.generate_verification_token()
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        context = {
            'user_name': f"{user.first_name} {user.last_name}",
            'user_type': user.user_type,
            'verification_url': verification_url,
            'site_name': 'Appointment Booking System'}
        subject = '🎉 Welcome! Please verify your email address'
        try:
            html_message = render_to_string('emails/email_verification.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False)
            logger.info(f"Verification email sent successfully to: {user.email}")
            return True 
        except Exception as template_error:
            logger.warning(f"HTML template failed, sending simple email: {str(template_error)}")
            send_simple_verification_email(user, verification_url)
            return True   
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False


def send_simple_verification_email(user, verification_url):
    subject = '🎉 Welcome! Please verify your email address'
    message = f"""
Hello {user.first_name} {user.last_name}!

Thank you for registering with our Appointment Booking System!

To complete your registration, please verify your email address by clicking this link:
{verification_url}

This link will expire in 24 hours for security reasons.

If you didn't create this account, please ignore this email.

Best regards,
The Appointment Booking Team
"""
    send_mail(
        subject=subject,
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False)
    logger.info(f"Fallback verification email sent to: {user.email}")


def send_verification_success_email(user):
    logger.info(f"Sending verification success email to: {user.email}")
    
    subject = '✅ Email Verified Successfully - Welcome!'
    message = f"""
Hello {user.first_name}!

Great news! Your email address has been successfully verified.

You can now:
- Log in to your account
- Start booking appointments with local businesses
- Manage your profile and preferences
"""
    
    if user.user_type == 'business':
        message += """
- Set up your business profile
- Add your services and business hours
- Start accepting appointments from clients
"""
    
    message += """
Welcome to the Appointment Booking System!

Best regards,
The Appointment Booking Team
"""
    try:
        send_mail(
            subject=subject,
            message=message.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False)
        logger.info(f"Success email sent to: {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send success email to {user.email}: {str(e)}")
        return False