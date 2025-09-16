from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Appointment
from .serializers import AppointmentSerializer
from businesses.models import Business, Service
from datetime import datetime, timedelta
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
import logging
from .utils import send_appointment_confirmation, generate_available_time_slots

# NEW ADDITION - FIX : 03/06/2025
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
import uuid

User = get_user_model()
### END OF NEW ADDITION

logger = logging.getLogger(__name__)

class IsAppointmentOwnerOrBusinessOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.user_type == 'admin':
            return True        
        if request.user.user_type == 'business' and request.user == obj.business.owner:
            return True
        if request.user.user_type == 'client' and request.user == obj.client:
            return True
        return False


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        logger.info(f"Getting appointments for user: {user.username} (type: {user.user_type})")
        if user.user_type == 'admin':
            queryset = Appointment.objects.all()
            logger.info(f"Admin user - returning all {queryset.count()} appointments")
            return queryset
        if user.user_type == 'business':
            user_businesses = Business.objects.filter(owner=user)
            logger.info(f"Business user owns {user_businesses.count()} businesses")
            queryset = Appointment.objects.filter(business__in=user_businesses)
            logger.info(f"Business user - returning {queryset.count()} appointments for their businesses")
            return queryset
        if user.user_type == 'client':
            queryset = Appointment.objects.filter(client=user)
            logger.info(f"Client user - returning {queryset.count()} appointments")
            return queryset
        return Appointment.objects.none()
    

    def perform_create(self, serializer):
        if self.request.user.user_type == 'business':
            print("BUSINESS OWNER CREATING APPOINTMENT")
            client_info = self.request.data.get('client_info')
            if client_info:
                print("Walk-in client info provided:", client_info)
                client_user = self.create_or_get_walkin_client(client_info)
                appointment = serializer.save(client=client_user)
            else:
                print("No client_info provided - using business owner as client")
                appointment = serializer.save(client=self.request.user)
        elif self.request.user.user_type == 'client':
            print("CLIENT CREATING APPOINTMENT")
            appointment = serializer.save(client=self.request.user)
        else:
            appointment = serializer.save()
        try:
            send_appointment_confirmation(appointment)
            appointment.email_confirmation_sent = True
            appointment.save(update_fields=['email_confirmation_sent'])
            print("Appointment confirmation emails sent successfully!")
        except Exception as e:
            print(f"Error sending appointment emails: {str(e)}")
    

    def create_or_get_walkin_client(self, client_info):
        first_name = client_info.get('first_name', '').strip()
        last_name = client_info.get('last_name', '').strip()
        email = client_info.get('email', '').strip()
        phone = client_info.get('phone_number', '').strip()
        print(f"Looking for walk-in client: {first_name} {last_name} ({email})")
        if email:
            try:
                existing_user = User.objects.get(email=email)
                print(f"Found existing user by email: {existing_user.username}")
                return existing_user
            except User.DoesNotExist:
                pass
        base_username = f"walkin_{first_name}_{last_name}".lower().replace(' ', '_')
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        random_password = get_random_string(12)
        walkin_client = User.objects.create_user(
            username=username,
            email=email if email else f"{username}@walkin.local",
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            user_type='client',
            password=random_password)
        print(f"Created new walk-in client: {walkin_client.username} ({walkin_client.email})")
        return walkin_client 
    

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method == 'POST' and self.request.user.user_type not in ['client', 'business', 'admin']:
            self.permission_denied(
                request, 
                message="Only clients, business owners and admins can create appointments.")
    

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        permission = IsAppointmentOwnerOrBusinessOwner()
        if not permission.has_object_permission(request, self, obj):
            self.permission_denied(
                request,
                message="You don't have permission to access this appointment.")

    # FIX : 17/6

    def perform_update(self, serializer):
        old_appointment = self.get_object()
        old_status = old_appointment.status
        appointment = serializer.save()
        new_status = appointment.status
        print(f"APPOINTMENT UPDATE DEBUG:")
        print(f"  - Appointment ID: {appointment.id}")
        print(f"  - Old status: {old_status}")
        print(f"  - New status: {new_status}")
        print(f"  - Updated by: {self.request.user.username}")
        changed_by = 'system'  
        if self.request.user == appointment.client:
            changed_by = 'client'
        elif self.request.user == appointment.business.owner or self.request.user.user_type == 'admin':
            changed_by = 'business'
        if old_status != new_status:
            print(f"  - Status changed from {old_status} to {new_status}")
            if new_status == 'confirmed':
                print("  - Status changed to confirmed - sending confirmation email")
                try:
                    send_appointment_confirmation(appointment)
                    print("  - Status change confirmation email sent!")
                except Exception as e:
                    print(f"  - Error sending status change email: {str(e)}")
                    logger.error(f"Failed to send status change confirmation email: {str(e)}")
            elif new_status == 'cancelled':
                print("  - Status changed to cancelled - sending cancellation emails")
                try:
                    from .utils import send_appointment_cancellation_emails
                    send_appointment_cancellation_emails(appointment, cancelled_by=changed_by)
                    print("  - Cancellation emails sent!")
                except Exception as e:
                    print(f"  - Error sending cancellation emails: {str(e)}")
                    logger.error(f"Failed to send cancellation emails: {str(e)}")   
        else:
            print(f"  - No status change detected")

    # END OF FIX

    
    @action(detail=False, methods=['get'])
    def my_appointments(self, request):
        user = request.user
        today = timezone.now().date()
        logger.info(f"Getting my_appointments for user: {user.username} (type: {user.user_type})")
        base_queryset = self.get_queryset()
        upcoming = base_queryset.filter(
            Q(date__gt=today) | 
            (Q(date=today) & Q(start_time__gte=timezone.now().time()))).order_by('date', 'start_time')
        past = base_queryset.filter(
            Q(date__lt=today) | 
            (Q(date=today) & Q(start_time__lt=timezone.now().time()))).order_by('-date', '-start_time')
        logger.info(f"Found {upcoming.count()} upcoming and {past.count()} past appointments")
        return Response({
            'upcoming': AppointmentSerializer(upcoming, many=True).data,
            'past': AppointmentSerializer(past, many=True).data})

    # FIX: 17/6

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status == 'cancelled':
            return Response(
                {"detail": "This appointment is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST)
        if appointment.status == 'completed':
            return Response(
                {"detail": "Cannot cancel a completed appointment."},
                status=status.HTTP_400_BAD_REQUEST)
        cancelled_by = 'system'  
        if request.user == appointment.client:
            cancelled_by = 'client'
        elif request.user == appointment.business.owner or request.user.user_type == 'admin':
            cancelled_by = 'business'
        old_status = appointment.status
        appointment.status = 'cancelled'
        appointment.save()
        logger.info(f"Appointment {appointment.id} cancelled by {request.user.username} (cancelled_by: {cancelled_by})")
        try:
            from .utils import send_appointment_cancellation_emails
            send_appointment_cancellation_emails(appointment, cancelled_by=cancelled_by)
            logger.info(f"Cancellation emails sent successfully for appointment {appointment.id}")
        except Exception as e:
            logger.error(f"Failed to send cancellation emails for appointment {appointment.id}: {str(e)}")
        return Response(
            {"detail": "Appointment cancelled successfully. Cancellation emails have been sent."},
            status=status.HTTP_200_OK)

        # END OF FIX 


    @action(detail=False, methods=['get'])
    def business_appointments(self, request):
        if request.user.user_type != 'business':
            return Response(
                {"detail": "Only business owners can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN)
        business_id = request.query_params.get('business_id')
        if business_id:
            try:
                business = Business.objects.get(id=business_id, owner=request.user)
                appointments = Appointment.objects.filter(business=business)
            except Business.DoesNotExist:
                return Response(
                    {"detail": "Business not found or you don't own it."},
                    status=status.HTTP_404_NOT_FOUND)
        else:
            user_businesses = Business.objects.filter(owner=request.user)
            appointments = Appointment.objects.filter(business__in=user_businesses)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


class AppointmentAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.user_type != 'admin':
            return Response(
                {"detail": "You don't have permission to access this resource."},
                status=status.HTTP_403_FORBIDDEN)
        appointments = Appointment.objects.all()
        total_appointments = appointments.count()
        pending_appointments = appointments.filter(status='pending').count()
        confirmed_appointments = appointments.filter(status='confirmed').count()
        cancelled_appointments = appointments.filter(status='cancelled').count()
        completed_appointments = appointments.filter(status='completed').count()
        User = get_user_model()
        total_users = User.objects.count()
        total_clients = User.objects.filter(user_type='client').count()
        total_business_owners = User.objects.filter(user_type='business').count()
        total_businesses = Business.objects.count()
        recent_appointments = Appointment.objects.order_by('-created_at')[:5]
        recent_appointments_data = AppointmentSerializer(recent_appointments, many=True).data
        return Response({
            'total_appointments': total_appointments,
            'pending_appointments': pending_appointments,
            'confirmed_appointments': confirmed_appointments,
            'cancelled_appointments': cancelled_appointments,
            'completed_appointments': completed_appointments,
            'total_users': total_users,
            'total_clients': total_clients,
            'total_business_owners': total_business_owners,
            'total_businesses': total_businesses,
            'recent_appointments': recent_appointments_data})


class AvailableTimeSlotsView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, *args, **kwargs):
        business_id = request.query_params.get('business_id')
        service_id = request.query_params.get('service_id')
        date_str = request.query_params.get('date')
        print(f"Available slots request: business_id={business_id}, service_id={service_id}, date={date_str}")
        if not business_id or not service_id or not date_str:
            return Response(
                {"detail": "business_id, service_id and date are required parameters."},
                status=status.HTTP_400_BAD_REQUEST)
        try:
            business = Business.objects.get(pk=business_id)
            service = Service.objects.get(pk=service_id)
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            print(f"Found business: {business.name}, service: {service.name}, date: {date}")
        except (Business.DoesNotExist, Service.DoesNotExist, ValueError) as e:
            print(f"Error finding business/service: {e}")
            return Response(
                {"detail": "Invalid business_id, service_id or date format."},
                status=status.HTTP_400_BAD_REQUEST)
        try:
            available_slots = generate_available_time_slots(business, service, date)
            print(f"Generated {len(available_slots)} available slots")
            return Response({"available_slots": available_slots})
        except Exception as e:
            print(f"Error generating slots: {e}")
            return Response(
                {"detail": "Failed to generate available slots."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)