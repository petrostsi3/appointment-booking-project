from rest_framework import serializers
from .models import Business, BusinessHours, BusinessTimePeriod, Service, BusinessCategory, CategoryRequest
from accounts.serializers import UserProfileSerializer

class BusinessTimePeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessTimePeriod
        fields = ['id', 'start_time', 'end_time', 'period_name']
        
    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time")
        return data


class BusinessHoursSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()
    time_periods = BusinessTimePeriodSerializer(source='time_periods_set', many=True, read_only=True)
    
    class Meta:
        model = BusinessHours
        fields = ['id', 'day', 'day_name', 'is_closed', 'time_periods']
        
    def get_day_name(self, obj):
        return obj.get_day_display()


class BusinessHoursCreateUpdateSerializer(serializers.ModelSerializer):
    time_periods = BusinessTimePeriodSerializer(many=True, required=False)
    
    class Meta:
        model = BusinessHours
        fields = ['day', 'is_closed', 'time_periods']
    
    def create(self, validated_data):
        time_periods_data = validated_data.pop('time_periods', [])
        business_hours = BusinessHours.objects.create(**validated_data)
        for period_data in time_periods_data:
            BusinessTimePeriod.objects.create(business_hours=business_hours, **period_data)
        return business_hours
    

    def update(self, instance, validated_data):
        time_periods_data = validated_data.pop('time_periods', None)        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if time_periods_data is not None:
            instance.time_periods_set.all().delete()
            for period_data in time_periods_data:
                BusinessTimePeriod.objects.create(business_hours=instance, **period_data)
        return instance


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'duration', 'price', 'is_active']

        
class BusinessCategorySerializer(serializers.ModelSerializer):
    business_count = serializers.ReadOnlyField()
    
    class Meta:
        model = BusinessCategory
        fields = ['id', 'name', 'slug', 'description', 'icon_class', 'color', 'business_count']


class CategoryRequestSerializer(serializers.ModelSerializer):
    requested_by_details = UserProfileSerializer(source='requested_by', read_only=True)
    created_category_details = BusinessCategorySerializer(source='created_category', read_only=True)
    merged_with_category_details = BusinessCategorySerializer(source='merged_with_category', read_only=True)
    
    class Meta:
        model = CategoryRequest
        fields = [
            'id', 'business_name', 'requested_category_name', 'requested_description', 
            'service_examples', 'status', 'admin_notes', 'reviewed_at',
            'created_at', 'requested_by_details', 'created_category_details', 
            'merged_with_category_details']
        read_only_fields = ['status', 'admin_notes', 'reviewed_at', 'created_at']
        

    def validate_requested_category_name(self, value):
        if BusinessCategory.objects.filter(name__iexact=value.strip()).exists():
            raise serializers.ValidationError(f"A category named '{value}' already exists.")
        return value.strip()
    

    def validate_business_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Business name cannot be empty.")
        return value.strip()
    

    def validate_requested_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Category description is required.")
        return value.strip()
    

    def validate_service_examples(self, value):
        if not value.strip():
            raise serializers.ValidationError("Service examples are required.")
        return value.strip()


class CategoryRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryRequest
        fields = ['business_name', 'requested_category_name', 'requested_description', 'service_examples']
        
    def validate_requested_category_name(self, value):
        if BusinessCategory.objects.filter(name__iexact=value.strip()).exists():
            raise serializers.ValidationError(f"A category named '{value}' already exists.")
        return value.strip()
    
    def validate_business_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Business name cannot be empty.")
        return value.strip()
    
    def validate_requested_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Category description is required.")
        return value.strip()
    
    def validate_service_examples(self, value):
        if not value.strip():
            raise serializers.ValidationError("Service examples are required.")
        return value.strip()


class BusinessSerializer(serializers.ModelSerializer):
    owner_details = UserProfileSerializer(source='owner', read_only=True)
    business_hours = BusinessHoursSerializer(many=True, read_only=True)
    services = ServiceSerializer(many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()
    category_details = BusinessCategorySerializer(source='category', read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    category_icon = serializers.ReadOnlyField(source='category.icon_class')
    category_color = serializers.ReadOnlyField(source='category.color')
    
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'description', 'address', 'phone', 'email', 'logo', 
            'logo_url', 'owner', 'owner_details', 'business_hours', 'services',
            'category', 'category_details', 'category_name', 'category_icon', 'category_color',
            'is_active', 'created_at']
        read_only_fields = ['owner_details', 'business_hours', 'services', 'logo_url', 'owner', 
                           'category_details', 'category_name', 'category_icon', 'category_color',
            'is_active', 'created_at']
        

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
        return None


class BusinessDetailSerializer(BusinessSerializer):
    class Meta(BusinessSerializer.Meta):
        pass