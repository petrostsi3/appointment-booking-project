from django.contrib import admin
from .models import Business, BusinessHours, Service, BusinessCategory, CategoryRequest
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils import timezone
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings


class BusinessHoursInline(admin.TabularInline):
    model = BusinessHours
    extra = 7  # Show all days of the week


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 1

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'category', 'email', 'phone', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'owner__username', 'owner__email')
    inlines = [BusinessHoursInline, ServiceInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner', 'category')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'duration', 'price', 'is_active')
    list_filter = ('is_active', 'business')
    search_fields = ('name', 'business__name')


@admin.register(BusinessCategory)
class BusinessCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'business_count', 'sort_order', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('sort_order', 'name')
    list_editable = ('sort_order', 'is_active')
    
    def business_count(self, obj):
        return obj.businesses.filter(is_active=True).count()
    business_count.short_description = 'Active Businesses'


@admin.register(CategoryRequest)
class CategoryRequestAdmin(admin.ModelAdmin):
    list_display = (
        'requested_category_name', 
        'business_name', 
        'requested_by', 
        'status_badge', 
        'created_at',
        'reviewed_by',
        'action_buttons')
    list_filter = ('status', 'created_at', 'reviewed_at')
    search_fields = (
        'requested_category_name', 
        'business_name', 
        'requested_by__username',
        'requested_by__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'reviewed_at')
    fieldsets = (
        ('Request Information', {
            'fields': (
                'requested_by', 
                'business_name',
                'requested_category_name',
                'requested_description',
                'service_examples')
        }),
        ('Review Status', {
            'fields': (
                'status',
                'admin_notes',
                'reviewed_by',
                'reviewed_at',
                'created_category',
                'merged_with_category')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }))
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green', 
            'rejected': 'red',
            'merged': 'blue'}
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: rgba({}, 0.1);">{}</span>',
            color,
            '255,165,0' if color == 'orange' else '0,128,0' if color == 'green' else '255,0,0' if color == 'red' else '0,0,255',
            obj.get_status_display())
    status_badge.short_description = 'Status'
    
    def action_buttons(self, obj):
        if obj.status == 'pending':
            return format_html(
                '<a class="button" href="{}" style="background: #007bff; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">📋 Review Request</a>',
                reverse('admin:review_category_request', args=[obj.pk]))
        elif obj.status == 'approved':
            return format_html('<span style="color: green;">✅ Approved</span>')
        elif obj.status == 'rejected':
            return format_html('<span style="color: red;">❌ Rejected</span>')
        elif obj.status == 'merged':
            return format_html('<span style="color: blue;">🔄 Merged</span>')
        return '-'
    action_buttons.short_description = 'Actions'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:request_id>/review/',
                self.admin_site.admin_view(self.review_request_view),
                name='review_category_request')]
        return custom_urls + urls
    
    def review_request_view(self, request, request_id):
        category_request = get_object_or_404(CategoryRequest, pk=request_id)
        if request.method == 'POST':
            action = request.POST.get('action')
            admin_notes = request.POST.get('admin_notes', '')
            if action == 'approve':
                category_name = request.POST.get('category_name', category_request.requested_category_name)
                icon_class = request.POST.get('icon_class', 'fas fa-store')
                color = request.POST.get('color', '#007bff')
                try:
                    new_category = BusinessCategory.objects.create(
                        name=category_name,
                        slug=category_name.lower().replace(' ', '-').replace('&', 'and'),
                        description=category_request.requested_description,
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
                            subject=f'✅ Category Request Approved: {category_name}',
                            message=f'''
Hello {category_request.requested_by.first_name}! 

Great news! Your category request has been approved.

📋 APPROVED CATEGORY:
Category Name: "{category_name}"
Description: {category_request.requested_description}

WHAT'S NEXT:
• The new category is now available for all businesses to use
• You can update your business profile to use this new category
• Other businesses can also benefit from your suggestion

{f"💬 Admin Notes: {admin_notes}" if admin_notes else ""}

Thank you for helping us improve our platform!

Best regards,
The Appointment Booking Team

---
This is an automated message. Please do not reply to this email.
                            ''',
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[category_request.requested_by.email],
                            fail_silently=False)
                        messages.success(request, f'Category "{category_name}" approved and email sent to {category_request.requested_by.email}')
                    except Exception as e:
                        messages.warning(request, f'Category approved but email failed: {str(e)}')
                except Exception as e:
                    messages.error(request, f'Failed to create category: {str(e)}')   
            elif action == 'reject':
                category_request.status = 'rejected'
                category_request.admin_notes = admin_notes
                category_request.reviewed_by = request.user
                category_request.reviewed_at = timezone.now()
                category_request.save()
                
                try:
                    send_mail(
                        subject=f'Category Request Update: {category_request.requested_category_name}',
                        message=f'''
Hello {category_request.requested_by.first_name},

Thank you for your category request for "{category_request.requested_category_name}".

After review, we've determined that this request doesn't meet our current category guidelines.

{f"💬 Admin Notes: {admin_notes}" if admin_notes else ""}

🔄 ALTERNATIVES:
• You can still list your business under "Other Services"
• Choose from our existing categories that might fit your business
• Feel free to submit a new request with different details

If you have questions, please contact our support team.

Best regards,
The Appointment Booking Team

---
This is an automated message. Please do not reply to this email.
                        ''',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[category_request.requested_by.email],
                        fail_silently=False,)
                    messages.success(request, f'Category request rejected and email sent to {category_request.requested_by.email}')
                except Exception as e:
                    messages.warning(request, f'Category rejected but email failed: {str(e)}')
            elif action == 'merge':
                merge_category_id = request.POST.get('merge_category')
                if merge_category_id:
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
Hello {category_request.requested_by.first_name},

Thank you for your category request for "{category_request.requested_category_name}".

After review, we found that your business fits well within our existing "{merge_category.name}" category.

RECOMMENDED CATEGORY:
Category: "{merge_category.name}"
Description: {merge_category.description}

NEXT STEPS:
• Update your business profile to use the "{merge_category.name}" category
• This category covers the services you mentioned in your request

{f"💬 Admin Notes: {admin_notes}" if admin_notes else ""}

Best regards,
The Appointment Booking Team

---
This is an automated message. Please do not reply to this email.
                                ''',
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[category_request.requested_by.email],
                                fail_silently=False)
                            messages.success(request, f'Category request merged with "{merge_category.name}" and email sent to {category_request.requested_by.email}')
                        except Exception as e:
                            messages.warning(request, f'Category merged but email failed: {str(e)}')
                    except BusinessCategory.DoesNotExist:
                        messages.error(request, 'Selected merge category not found')
                else:
                    messages.error(request, 'Please select a category to merge with')
            return redirect('admin:businesses_categoryrequest_changelist')
        context = {
            'category_request': category_request,
            'categories': BusinessCategory.objects.filter(is_active=True).order_by('name'),
            'title': f'Review Category Request: {category_request.requested_category_name}',
            'opts': self.model._meta,
            'has_view_permission': True}
        return render(request, 'admin/review_category_request.html', context)