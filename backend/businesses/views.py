from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Business, BusinessHours, BusinessTimePeriod, Service, BusinessCategory, CategoryRequest
from .serializers import (
    BusinessSerializer, BusinessDetailSerializer, BusinessHoursSerializer, 
    BusinessHoursCreateUpdateSerializer, ServiceSerializer, BusinessCategorySerializer,
    CategoryRequestSerializer, BusinessTimePeriodSerializer)
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from django.db.models import Q
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class IsAdminOrBusinessOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type == 'business' or 
            request.user.user_type == 'admin')


class BusinessCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusinessCategory.objects.filter(is_active=True).order_by('sort_order', 'name')
    serializer_class = BusinessCategorySerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=True, methods=['get'])
    def businesses(self, request, pk=None):
        category = self.get_object()
        businesses = category.businesses.filter(is_active=True)
        search = request.query_params.get('search')
        if search:
            businesses = businesses.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search))
        serializer = BusinessSerializer(businesses, many=True, context={'request': request})
        return Response({
            'category': BusinessCategorySerializer(category).data,
            'businesses': serializer.data})


class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    def get_queryset(self):
        user = self.request.user
        queryset = Business.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            if category.isdigit():
                queryset = queryset.filter(category_id=category)
            else:
                queryset = queryset.filter(category__slug=category)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(category__name__icontains=search))
        if not user.is_authenticated:
            return queryset
        if user.user_type == 'admin':
            return queryset
        elif user.user_type == 'business':
            return queryset
        else:
            return queryset
    

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BusinessDetailSerializer
        return BusinessSerializer
    

    def perform_create(self, serializer):
        logger.info(f"Creating business with user: {self.request.user} (ID: {self.request.user.id})")
        business = serializer.save(owner=self.request.user)
        logger.info(f"Business created: {business.name} (ID: {business.id}) owned by {business.owner.username}")
        return business
    

    def create(self, request, *args, **kwargs):
        logger.info(f"Business creation request from user: {request.user.username} (ID: {request.user.id})")
        logger.info(f"Request data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = self.perform_create(serializer)
        response_serializer = self.get_serializer(business)
        headers = self.get_success_headers(response_serializer.data)
        logger.info(f"Returning business data: {response_serializer.data}")
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        categories = BusinessCategory.objects.filter(is_active=True).order_by('sort_order', 'name')
        result = []
        for category in categories:
            businesses = category.businesses.filter(is_active=True)[:6]  # Limit to 6 per category
            if businesses.exists():
                result.append({
                    'category': BusinessCategorySerializer(category).data,
                    'businesses': BusinessSerializer(businesses, many=True, context={'request': request}).data})
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        categories = BusinessCategory.objects.filter(is_active=True).order_by('sort_order', 'name')[:8]
        featured_businesses = []
        for category in categories:
            business = category.businesses.filter(is_active=True).first()
            if business:
                featured_businesses.append(business)
        serializer = BusinessSerializer(featured_businesses, many=True, context={'request': request})
        return Response(serializer.data)


    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def request_category(self, request):
        if request.user.user_type not in ['business', 'admin']:
            return Response(
                {'error': 'Only business owners can request new categories'},
                status=status.HTTP_403_FORBIDDEN)
        serializer = CategoryRequestSerializer(data=request.data)
        if serializer.is_valid():
            category_request = serializer.save(requested_by=request.user)
            try:
                admin_email = getattr(settings, 'ADMIN_EMAIL', settings.DEFAULT_FROM_EMAIL)
                send_mail(
                    subject=f'🆕 New Category Request: {category_request.requested_category_name}',
                    message=f'''
🏢 NEW CATEGORY REQUEST RECEIVED

📋 REQUEST DETAILS:
Business Name: {category_request.business_name}
Requested Category: {category_request.requested_category_name}
Description: {category_request.requested_description}
Service Examples: {category_request.service_examples}

👤 REQUESTED BY:
Name: {request.user.first_name} {request.user.last_name}
Email: {request.user.email}
Username: {request.user.username}

📅 Request Date: {category_request.created_at.strftime('%Y-%m-%d %H:%M:%S')}

Please review and take action on this request
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[admin_email],
                    fail_silently=False,
                )
                
                logger.info(f"Admin notification sent for category request: {category_request.requested_category_name}")
                
            except Exception as e:
                logger.error(f"Failed to send admin notification email: {str(e)}")
            
            try:
                send_mail(
                    subject=f'Category Request Received: {category_request.requested_category_name}',
                    message=f'''
Hello {request.user.first_name}! 

Thank you for your category request. We have received your submission and our team will review it shortly.

📋 YOUR REQUEST DETAILS:
Business: {category_request.business_name}
Requested Category: {category_request.requested_category_name}
Description: {category_request.requested_description}

⏰ WHAT HAPPENS NEXT:
• Our admin team will review your request within 2-3 business days
• You will receive an email notification with our decision
• If approved, the new category will be available for all businesses
• If not approved, we'll provide feedback and suggest alternatives

📧 QUESTIONS?
If you have any questions about this request, please don't hesitate to contact our support team.

Thank you for helping us improve our platform!

Best regards,
The Appointment Booking Team

---
This is an automated confirmation email. Please do not reply to this message.
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[request.user.email],
                    fail_silently=False,
                )
                
                logger.info(f"Confirmation email sent to business owner: {request.user.email}")
            except Exception as e:
                logger.error(f"Failed to send confirmation email to business owner: {str(e)}")
            return Response({
                'message': 'Category request submitted successfully! You will receive a confirmation email shortly. We will review your request within 2-3 business days.',
                'request_id': category_request.id,
                'status': 'pending'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusinessHoursViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BusinessHoursCreateUpdateSerializer
        return BusinessHoursSerializer
    

    def get_queryset(self):
        return BusinessHours.objects.filter(business_id=self.kwargs['business_pk'])
    

    def perform_create(self, serializer):
        business_id = self.kwargs['business_pk']
        business = Business.objects.get(id=business_id)
        if self.request.user == business.owner or self.request.user.user_type == 'admin':
            serializer.save(business_id=business_id)
        else:
            raise permissions.PermissionDenied("You don't have permission to set business hours.")
    

    @action(detail=True, methods=['post'])
    def add_time_period(self, request, business_pk=None, pk=None):
        business_hours = self.get_object()
        if request.user != business_hours.business.owner and request.user.user_type != 'admin':
            return Response(
                {"detail": "You don't have permission to modify business hours."},
                status=status.HTTP_403_FORBIDDEN)
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        period_name = request.data.get('period_name', '')
        if not start_time or not end_time:
            return Response(
                {"detail": "start_time and end_time are required."},
                status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                time_period = BusinessTimePeriod.objects.create(
                    business_hours=business_hours,
                    start_time=start_time,
                    end_time=end_time,
                    period_name=period_name)
                serializer = BusinessTimePeriodSerializer(time_period)
                return Response(serializer.data, status=status.HTTP_201_CREATED)       
        except Exception as e:
            return Response(
                {"detail": f"Failed to create time period: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST)
    

    @action(detail=True, methods=['delete'])
    def remove_time_period(self, request, business_pk=None, pk=None):
        business_hours = self.get_object()
        period_id = request.query_params.get('period_id')
        if request.user != business_hours.business.owner and request.user.user_type != 'admin':
            return Response(
                {"detail": "You don't have permission to modify business hours."},
                status=status.HTTP_403_FORBIDDEN)
        if not period_id:
            return Response(
                {"detail": "period_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST)
        try:
            time_period = BusinessTimePeriod.objects.get(
                id=period_id,
                business_hours=business_hours)
            time_period.delete()
            return Response(
                {"detail": "Time period removed successfully."},
                status=status.HTTP_200_OK)
        except BusinessTimePeriod.DoesNotExist:
            return Response(
                {"detail": "Time period not found."},
                status=status.HTTP_404_NOT_FOUND)
        
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request, business_pk=None):
        business = Business.objects.get(id=business_pk)
        if request.user != business.owner and request.user.user_type != 'admin':
            return Response(
                {"detail": "You don't have permission to modify business hours."},
                status=status.HTTP_403_FORBIDDEN)
        hours_data = request.data.get('business_hours', [])
        try:
            with transaction.atomic():
                BusinessHours.objects.filter(business=business).delete()
                for day_data in hours_data:
                    day = day_data.get('day')
                    is_closed = day_data.get('is_closed', False)
                    time_periods = day_data.get('time_periods', [])
                    business_hours = BusinessHours.objects.create(
                        business=business,
                        day=day,
                        is_closed=is_closed)
                    if not is_closed:
                        for period_data in time_periods:
                            BusinessTimePeriod.objects.create(
                                business_hours=business_hours,
                                start_time=period_data.get('start_time'),
                                end_time=period_data.get('end_time'),
                                period_name=period_data.get('period_name', ''))
                updated_hours = BusinessHours.objects.filter(business=business)
                serializer = BusinessHoursSerializer(updated_hours, many=True)
                return Response({
                    "detail": "Business hours updated successfully.",
                    "business_hours": serializer.data
                }, status=status.HTTP_200_OK)       
        except Exception as e:
            return Response(
                {"detail": f"Failed to update business hours: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST)


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Service.objects.filter(business_id=self.kwargs['business_pk'])
    
    def perform_create(self, serializer):
        business_id = self.kwargs['business_pk']
        business = Business.objects.get(id=business_id)
        if self.request.user == business.owner or self.request.user.user_type == 'admin':
            serializer.save(business_id=business_id)
        else:
            raise permissions.PermissionDenied("You don't have permission to add services.")


class AdminBusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.user.is_authenticated and self.request.user.user_type == 'admin':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class CategoryRequestViewSet(viewsets.ModelViewSet):
    queryset = CategoryRequest.objects.all().order_by('-created_at')
    serializer_class = CategoryRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.user.is_authenticated and self.request.user.user_type == 'admin':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        category_request = self.get_object()
        if category_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'},
                status=status.HTTP_400_BAD_REQUEST)
        category_name = request.data.get('category_name', category_request.requested_category_name)
        category_description = request.data.get('category_description', category_request.requested_description)
        icon_class = request.data.get('icon_class', 'fas fa-store')
        color = request.data.get('color', '#007bff')
        admin_notes = request.data.get('admin_notes', '')
        try:
            with transaction.atomic():
                new_category = BusinessCategory.objects.create(
                    name=category_name,
                    slug=category_name.lower().replace(' ', '-'),
                    description=category_description,
                    icon_class=icon_class,
                    color=color,
                    is_active=True)
                category_request.status = 'approved'
                category_request.admin_notes = admin_notes
                category_request.reviewed_by = request.user
                category_request.reviewed_at = timezone.now()
                category_request.created_category = new_category
                category_request.save()
                try:
                    send_mail(
                        subject=f'Category Request Approved: {category_name}',
                        message=f'''
Great news! Your category request has been approved.

Your requested category "{category_name}" is now available for all businesses to use.

You can now update your business profile to use this new category.

Thank you for helping us improve our platform!

Best regards,
The Appointment Booking Team
                        ''',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[category_request.requested_by.email],
                        fail_silently=True)
                except Exception as e:
                    logger.error(f"Failed to send approval email: {str(e)}")
                return Response({
                    'message': 'Category request approved successfully',
                    'category': BusinessCategorySerializer(new_category).data
                }, status=status.HTTP_200_OK) 
        except Exception as e:
            return Response(
                {'error': f'Failed to approve category request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        category_request = self.get_object()
        if category_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'},
                status=status.HTTP_400_BAD_REQUEST)
        admin_notes = request.data.get('admin_notes', '')
        try:
            category_request.status = 'rejected'
            category_request.admin_notes = admin_notes
            category_request.reviewed_by = request.user
            category_request.reviewed_at = timezone.now()
            category_request.save()
            try:
                send_mail(
                    subject=f'Category Request Update: {category_request.requested_category_name}',
                    message=f'''
Thank you for your category request for "{category_request.requested_category_name}".

After review, we've determined that this request doesn't meet our current category guidelines.

{f"Admin notes: {admin_notes}" if admin_notes else ""}

You can still list your business under "Other Services" or choose from our existing categories.

If you have questions, please contact our support team.

Best regards,
The Appointment Booking Team
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[category_request.requested_by.email],
                    fail_silently=True)
            except Exception as e:
                logger.error(f"Failed to send rejection email: {str(e)}")
            return Response({
                'message': 'Category request rejected successfully'
            }, status=status.HTTP_200_OK) 
        except Exception as e:
            return Response(
                {'error': f'Failed to reject category request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    
    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
        category_request = self.get_object()
        if category_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'},
                status=status.HTTP_400_BAD_REQUEST)
        merge_category_id = request.data.get('merge_with_category')
        admin_notes = request.data.get('admin_notes', '')
        if not merge_category_id:
            return Response(
                {'error': 'merge_with_category is required'},
                status=status.HTTP_400_BAD_REQUEST)
        try:
            merge_category = BusinessCategory.objects.get(id=merge_category_id)
            category_request.status = 'merged'
            category_request.admin_notes = admin_notes
            category_request.reviewed_by = request.user
            category_request.reviewed_at = timezone.now()
            category_request.merged_with_category = merge_category
            category_request.save()
            try:
                send_mail(
                    subject=f'Category Request Update: {category_request.requested_category_name}',
                    message=f'''
Thank you for your category request for "{category_request.requested_category_name}".

After review, we found that your business fits well within our existing "{merge_category.name}" category.

We recommend updating your business profile to use the "{merge_category.name}" category, which covers: {merge_category.description}

{f"Admin notes: {admin_notes}" if admin_notes else ""}

Best regards,
The Appointment Booking Team
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[category_request.requested_by.email],
                    fail_silently=True)
            except Exception as e:
                logger.error(f"Failed to send merge email: {str(e)}")
            return Response({
                'message': 'Category request merged successfully',
                'merged_with': BusinessCategorySerializer(merge_category).data
            }, status=status.HTTP_200_OK)   
        except BusinessCategory.DoesNotExist:
            return Response({'error': 'Merge category not found'},
                status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Failed to merge category request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)