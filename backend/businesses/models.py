from django.db import models
from accounts.models import User


class BusinessCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon_class = models.CharField(
        max_length=50, 
        default='fas fa-store',
        help_text="Font Awesome icon class (e.g., 'fas fa-cut' for barbershop)")
    color = models.CharField(
        max_length=7, 
        default='#007bff',
        help_text="Hex color code for category theme")
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Default categories that can't be deleted")
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name = 'Business Category'
        verbose_name_plural = 'Business Categories'
    
    def __str__(self):
        return self.name
    
    @property
    def business_count(self):
        return self.businesses.filter(is_active=True).count()


class CategoryRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('merged', 'Merged with Existing Category'),)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='category_requests')
    business_name = models.CharField(max_length=200, help_text="Name of the business requesting this category")
    requested_category_name = models.CharField(max_length=100)
    requested_description = models.TextField()
    service_examples = models.TextField(help_text="Examples of services this business provides")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, null=True, help_text="Internal admin notes")
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviewed_category_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_category = models.ForeignKey(
        BusinessCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Category created from this request")
    merged_with_category = models.ForeignKey(
        BusinessCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='merged_requests',
        help_text="Existing category this request was merged with")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Category Request'
        verbose_name_plural = 'Category Requests'
    
    def __str__(self):
        return f"{self.requested_category_name} - {self.get_status_display()}"


class Business(models.Model):
    DAYS_OF_WEEK = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'))
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='businesses')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(
        BusinessCategory, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='businesses',
        help_text="Select the category that best describes your business")
    category_request = models.ForeignKey(
        CategoryRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Category request made by this business (if any)")
    address = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    logo = models.ImageField(upload_to='business_logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class BusinessHours(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='business_hours')
    day = models.IntegerField(choices=Business.DAYS_OF_WEEK)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'day')
        ordering = ['day']
        
    def __str__(self):
        return f"{self.business.name} - {self.get_day_display()}"
    
    @property
    def time_periods(self):
        return self.time_periods_set.all().order_by('start_time')
    
    def is_open_at_time(self, time):
        if self.is_closed:
            return False
        for period in self.time_periods:
            if period.start_time <= time <= period.end_time:
                return True
        return False


class BusinessTimePeriod(models.Model):
    business_hours = models.ForeignKey(
        BusinessHours, 
        on_delete=models.CASCADE, 
        related_name='time_periods_set')
    start_time = models.TimeField()
    end_time = models.TimeField()
    period_name = models.CharField(
        max_length=50, 
        blank=True, 
        help_text="Optional name like 'Morning', 'Afternoon', 'Evening'")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['start_time']
      
        
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
    
    def __str__(self):
        period_str = f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"
        if self.period_name:
            return f"{self.period_name}: {period_str}"
        return period_str


class Service(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    duration = models.IntegerField(help_text="Duration in minutes")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.business.name}"