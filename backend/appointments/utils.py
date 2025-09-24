from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, datetime, time
from businesses.models import BusinessHours, BusinessTimePeriod
from appointments.models import Appointment
import logging

logger = logging.getLogger(__name__)


def send_appointment_confirmation(appointment):
    logger.info(f"Sending appointment confirmation emails for appointment {appointment.id}")
    try:
        context = {
            'client_name': f"{appointment.client.first_name} {appointment.client.last_name}",
            'business_name': appointment.business.name,
            'business_owner': f"{appointment.business.owner.first_name} {appointment.business.owner.last_name}",
            'service_name': appointment.service.name,
            'service_price': appointment.service.price,
            'service_duration': appointment.service.duration,
            'appointment_date': appointment.date.strftime('%A, %B %d, %Y'),
            'appointment_time': f"{appointment.start_time.strftime('%H:%M')} - {appointment.end_time.strftime('%H:%M')}",
            'business_address': appointment.business.address or '',
            'business_phone': appointment.business.phone or '',
            'client_email': appointment.client.email,
            'client_phone': appointment.client.phone_number or '',
            'appointment_notes': appointment.notes or ''}
        client_subject = f'Appointment Confirmed - {appointment.business.name}'
        try:
            client_html_message = render_to_string('emails/appointment_confirmation_client.html', context)
            client_plain_message = strip_tags(client_html_message)
            send_mail(
                subject=client_subject,
                message=client_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appointment.client.email],
                html_message=client_html_message,
                fail_silently=False)
            logger.info(f"Client HTML confirmation email sent to: {appointment.client.email}") 
        except Exception as template_error:
            logger.warning(f"HTML template failed, sending simple email: {str(template_error)}")
            send_simple_client_email(appointment, context)
        business_subject = f'🔔 New Appointment - {context["client_name"]}'
        try:
            business_html_message = render_to_string('emails/appointment_notification_business.html', context)
            business_plain_message = strip_tags(business_html_message)
            send_mail(
                subject=business_subject,
                message=business_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appointment.business.owner.email],
                html_message=business_html_message,
                fail_silently=False)
            logger.info(f"Business HTML notification email sent to: {appointment.business.owner.email}")  
        except Exception as template_error:
            logger.warning(f"HTML template failed, sending simple email: {str(template_error)}")
            send_simple_business_email(appointment, context)
        logger.info("All appointment confirmation emails sent successfully!")
    except Exception as e:
        logger.error(f"Critical error in send_appointment_confirmation: {str(e)}")
        raise


def send_simple_client_email(appointment, context):
    subject = f'Appointment Confirmed - {appointment.business.name}'
    message = f"""
Dear {context['client_name']},

Your appointment has been confirmed! 🎉

📋 APPOINTMENT DETAILS:
🏢 Business: {context['business_name']}
✂️ Service: {context['service_name']}
📅 Date: {context['appointment_date']}
🕐 Time: {context['appointment_time']}
💰 Price: €{context['service_price']}
"""
    if context['business_address']:
        message += f"📍 Address: {context['business_address']}\n"
    if context['business_phone']:
        message += f"📞 Phone: {context['business_phone']}\n"
    message += f"""
If you need to cancel or reschedule, please contact us as soon as possible.

Looking forward to seeing you!

Best regards,
{context['business_name']}
    """
    send_mail(
        subject=subject,
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.client.email],
        fail_silently=False)
    logger.info(f"Fallback client email sent to: {appointment.client.email}")


def send_simple_business_email(appointment, context):
    subject = f'🔔 New Appointment - {context["client_name"]}'
    message = f"""
New appointment booked! 🎉

👤 CLIENT INFORMATION:
Name: {context['client_name']}
Email: {context['client_email']}
"""
    if context['client_phone']:
        message += f"Phone: {context['client_phone']}\n"
    message += f"""
📋 APPOINTMENT DETAILS:
✂️ Service: {context['service_name']}
📅 Date: {context['appointment_date']}
🕐 Time: {context['appointment_time']}
⏱️ Duration: {context['service_duration']} minutes
💰 Price: €{context['service_price']}
"""
    if context['appointment_notes']:
        message += f"📝 Notes: {context['appointment_notes']}\n"
    message += """
You can manage this appointment in your Business Dashboard.

Have a great day!
    """
    send_mail(
        subject=subject,
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.business.owner.email],
        fail_silently=False)
    logger.info(f"Fallback business email sent to: {appointment.business.owner.email}")


def test_email_configuration():
    try:
        test_subject = '🧪 Email Test - Appointment System'
        test_message = """
🎉 Congratulations! Your email configuration is working correctly!

This test email confirms that:
SMTP settings are correct
Authentication is successful  
Emails can be sent from your Django app

Your appointment system is ready to send real emails! 📧

Test completed at: """ + timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        send_mail(
            subject=test_subject,
            message=test_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  
            fail_silently=False)
        print("SUCCESS! Test email sent successfully!")
        print(f"Check your inbox: {settings.EMAIL_HOST_USER}")
        print("Your email configuration is working correctly!")
        print("\nNext steps:")
        print("1. Create a test appointment through your app")
        print("2. Verify both client and business emails are received")
        print("3. Check that HTML formatting looks good")
        return True    
    except Exception as e:
        print(f"EMAIL TEST FAILED: {str(e)}")
        print("\nTroubleshooting steps:")
        print("1. Check your .env file has correct EMAIL_HOST_USER and EMAIL_HOST_PASSWORD")
        print("2. Verify the app password is exactly 16 characters")
        print("3. Make sure 2FA is enabled on your Gmail account")
        print("4. Check that EMAIL_USE_TLS=True in your .env")
        print("5. Verify EMAIL_PORT=587 in your .env")
        return False


def send_appointment_reminder(appointment):
    subject = f'⏰ Reminder: Your appointment at {appointment.business.name} today'
    message = f"""
Dear {appointment.client.first_name},

This is a friendly reminder for your upcoming appointment:

📋 APPOINTMENT DETAILS:
🏢 Business: {appointment.business.name}
✂️ Service: {appointment.service.name}
📅 Date: {appointment.date.strftime('%A, %B %d, %Y')}
🕐 Time: {appointment.start_time.strftime('%H:%M')} - {appointment.end_time.strftime('%H:%M')}
"""
    if appointment.business.address:
        message += f"📍 Address: {appointment.business.address}\n"
    if appointment.business.phone:
        message += f"📞 Phone: {appointment.business.phone}\n"
    message += """
Looking forward to seeing you soon! 

If you need to cancel or reschedule, please contact us immediately.

Best regards,
""" + appointment.business.name
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.client.email],
        fail_silently=False)
    appointment.email_reminder_sent = True
    appointment.save(update_fields=['email_reminder_sent'])
    logger.info(f"⏰ Reminder email sent to: {appointment.client.email}")


def generate_available_time_slots(business, service, date):
    logger.info(f"GENERATING SLOTS FOR: {business.name} on {date}")
    now = timezone.now()
    today = now.date()
    current_time_only = now.time()
    day_of_week = date.weekday()
    try:
        business_hours = BusinessHours.objects.get(business=business, day=day_of_week)
        if business_hours.is_closed:
            logger.info(f"Business is closed on {business_hours.get_day_display()}")
            return []
        time_periods = business_hours.time_periods_set.all().order_by('start_time')
        if not time_periods.exists():
            logger.info(f"No time periods set for {business_hours.get_day_display()}")
            return []
        logger.info(f"Found {time_periods.count()} time periods:")
        for period in time_periods:
            logger.info(f"   - {period.period_name or 'Period'}: {period.start_time} - {period.end_time}")
    except BusinessHours.DoesNotExist:
        logger.info(f"No business hours set for day {day_of_week}")
        return []
    from appointments.models import Appointment
    existing_appointments = Appointment.objects.filter(
        business=business,
        date=date,
        status__in=['pending', 'confirmed']).order_by('start_time')
    logger.info(f"Found {existing_appointments.count()} existing appointments")
    service_duration = timedelta(minutes=service.duration)
    slot_increment = timedelta(minutes=15) 
    available_slots = []
    for period in time_periods:
        logger.info(f"\nProcessing period: {period.start_time} - {period.end_time}")
        period_start = datetime.combine(date, period.start_time)
        period_end = datetime.combine(date, period.end_time)
        current_time = period_start
        while current_time + service_duration <= period_end:
            slot_end_time = current_time + service_duration
            is_slot_in_future = True
            if date == today:
                slot_start_time_only = current_time.time()
                current_time_with_buffer = (now + timedelta(minutes=30)).time()
                if slot_start_time_only <= current_time_with_buffer:
                    is_slot_in_future = False
                    logger.info(f"   Slot {current_time.time()} is too soon (current time + buffer: {current_time_with_buffer})")
            if is_slot_in_future:
                is_available = True
                for appointment in existing_appointments:
                    appointment_start = datetime.combine(date, appointment.start_time)
                    appointment_end = datetime.combine(date, appointment.end_time)
                    if (current_time < appointment_end and slot_end_time > appointment_start):
                        is_available = False
                        logger.info(f"    Slot {current_time.time()} - {slot_end_time.time()} conflicts with existing appointment")
                        break
                if is_available:
                    slot = {
                        'start_time': current_time.strftime('%H:%M'),
                        'end_time': slot_end_time.strftime('%H:%M'),
                        'period_name': period.period_name or f'Period {period.id}'}
                    available_slots.append(slot)
                    logger.info(f"    Available: {slot['start_time']} - {slot['end_time']}")
            current_time += slot_increment
    logger.info(f"\nSUMMARY: Generated {len(available_slots)} available slots")
    return available_slots


def check_and_send_reminders():
    now = timezone.now()
    one_hour_from_now = now + timedelta(hours=1)
    today = now.date()
    upcoming_appointments = Appointment.objects.filter(
        date=today,
        status='confirmed',
        email_reminder_sent=False,
        start_time__gte=now.time(),
        start_time__lte=one_hour_from_now.time()) 
    logger.info(f"Checking reminders: Found {upcoming_appointments.count()} appointments needing reminders")
    for appointment in upcoming_appointments:
        try:
            send_appointment_reminder(appointment)
            logger.info(f"Reminder sent for appointment {appointment.id}")
        except Exception as e:
            logger.error(f"Failed to send reminder for appointment {appointment.id}: {str(e)}")


def send_status_change_notification(appointment, old_status, new_status):
    if old_status == new_status:
        return
    important_changes = [
        ('pending', 'confirmed'),
        ('confirmed', 'cancelled'),
        ('pending', 'cancelled')]
    if (old_status, new_status) not in important_changes:
        return
    try:
        if new_status == 'confirmed':
            send_appointment_confirmation(appointment) 
        elif new_status == 'cancelled':
            subject = f'Appointment Cancelled - {appointment.business.name}'
            message = f"""
Dear {appointment.client.first_name},

Unfortunately, your appointment has been cancelled.

📋 CANCELLED APPOINTMENT:
🏢 Business: {appointment.business.name}
✂️ Service: {appointment.service.name}
📅 Date: {appointment.date.strftime('%A, %B %d, %Y')}
🕐 Time: {appointment.start_time.strftime('%H:%M')} - {appointment.end_time.strftime('%H:%M')}

If you'd like to reschedule, please contact us or book a new appointment.

We apologize for any inconvenience.

Best regards,
{appointment.business.name}
"""
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appointment.client.email],
                fail_silently=False)
            logger.info(f"Cancellation email sent to: {appointment.client.email}")        
    except Exception as e:
        logger.error(f"Failed to send status change notification: {str(e)}")


def debug_email_settings():
    print("EMAIL CONFIGURATION DEBUG")
    print("=" * 40)
    print(f"EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'Not set')}")
    print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
    print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
    print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
    print(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Not set')}")
    print(f"EMAIL_HOST_PASSWORD: {'*' * len(getattr(settings, 'EMAIL_HOST_PASSWORD', '')) if getattr(settings, 'EMAIL_HOST_PASSWORD', '') else 'Not set'}")
    print(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')}")
    print("=" * 40)
    required_settings = [
        'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'EMAIL_HOST', 
        'EMAIL_PORT', 'EMAIL_USE_TLS', 'DEFAULT_FROM_EMAIL']
    missing_settings = []
    for setting in required_settings:
        if not getattr(settings, setting, None):
            missing_settings.append(setting)
    if missing_settings:
        print(f"Missing settings: {', '.join(missing_settings)}")
        return False
    else:
        print("All email settings are configured")
        return True
    

def send_appointment_cancellation_emails(appointment, cancelled_by='system'):
    logger.info(f"Sending appointment cancellation emails for appointment {appointment.id}")
    try:
        context = {
            'client_name': f"{appointment.client.first_name} {appointment.client.last_name}",
            'business_name': appointment.business.name,
            'business_owner': f"{appointment.business.owner.first_name} {appointment.business.owner.last_name}",
            'service_name': appointment.service.name,
            'service_price': appointment.service.price,
            'service_duration': appointment.service.duration,
            'appointment_date': appointment.date.strftime('%A, %B %d, %Y'),
            'appointment_time': f"{appointment.start_time.strftime('%H:%M')} - {appointment.end_time.strftime('%H:%M')}",
            'business_address': appointment.business.address or '',
            'business_phone': appointment.business.phone or '',
            'client_email': appointment.client.email,
            'client_phone': appointment.client.phone_number or '',
            'cancelled_by': cancelled_by,
            'cancellation_reason': get_cancellation_reason(cancelled_by)}
        client_subject = f'Appointment Cancelled - {appointment.business.name}'
        try:
            client_html_message = render_to_string('emails/appointment_cancellation_client.html', context)
            client_plain_message = strip_tags(client_html_message)
            send_mail(
                subject=client_subject,
                message=client_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appointment.client.email],
                html_message=client_html_message,
                fail_silently=False)
            logger.info(f"Client cancellation email sent to: {appointment.client.email}")
        except Exception as template_error:
            logger.warning(f"HTML template failed, sending simple email: {str(template_error)}")
            send_simple_cancellation_email_to_client(appointment, context)
        business_subject = f'Appointment Cancelled - {context["client_name"]}'
        try:
            business_html_message = render_to_string('emails/appointment_cancellation_business.html', context)
            business_plain_message = strip_tags(business_html_message)
            send_mail(
                subject=business_subject,
                message=business_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appointment.business.owner.email],
                html_message=business_html_message,
                fail_silently=False)
            logger.info(f"Business cancellation email sent to: {appointment.business.owner.email}")   
        except Exception as template_error:
            logger.warning(f"HTML template failed, sending simple email: {str(template_error)}")
            send_simple_cancellation_email_to_business(appointment, context)
        logger.info("All appointment cancellation emails sent successfully!")
    except Exception as e:
        logger.error(f"Critical error in send_appointment_cancellation_emails: {str(e)}")
        raise


def get_cancellation_reason(cancelled_by):
    reasons = {
        'client': 'This appointment was cancelled by the client.',
        'business': 'This appointment was cancelled by the business.',
        'system': 'This appointment was cancelled by the system.'}
    return reasons.get(cancelled_by, 'This appointment has been cancelled.')


def send_simple_cancellation_email_to_client(appointment, context):
    subject = f'❌ Appointment Cancelled - {appointment.business.name}'
    message = f"""
Dear {context['client_name']},

We're writing to inform you that your appointment has been cancelled.

📋 CANCELLED APPOINTMENT DETAILS:
🏢 Business: {context['business_name']}
✂️ Service: {context['service_name']}
📅 Date: {context['appointment_date']}
🕐 Time: {context['appointment_time']}
💰 Price: €{context['service_price']}

{context['cancellation_reason']}

If you'd like to reschedule, please contact us or book a new appointment through our website.

We apologize for any inconvenience this may cause.

Best regards,
{context['business_name']}
"""
    
    send_mail(
        subject=subject,
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.client.email],
        fail_silently=False)
    logger.info(f"Fallback client cancellation email sent to: {appointment.client.email}")


def send_simple_cancellation_email_to_business(appointment, context):
    subject = f'❌ Appointment Cancelled - {context["client_name"]}'
    message = f"""
An appointment has been cancelled.

👤 CLIENT INFORMATION:
Name: {context['client_name']}
Email: {context['client_email']}
"""
    
    if context['client_phone']:
        message += f"Phone: {context['client_phone']}\n"
    
    message += f"""
📋 CANCELLED APPOINTMENT DETAILS:
✂️ Service: {context['service_name']}
📅 Date: {context['appointment_date']}
🕐 Time: {context['appointment_time']}
⏱️ Duration: {context['service_duration']} minutes
💰 Price: €{context['service_price']}

{context['cancellation_reason']}

You can view your appointment calendar in your Business Dashboard.
"""
    
    send_mail(
        subject=subject,
        message=message.strip(),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.business.owner.email],
        fail_silently=False)
    logger.info(f"Fallback business cancellation email sent to: {appointment.business.owner.email}")