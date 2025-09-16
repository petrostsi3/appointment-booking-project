from rest_framework import serializers
from .models import Appointment
from accounts.serializers import UserProfileSerializer
from businesses.serializers import BusinessSerializer, ServiceSerializer
from datetime import datetime, timedelta


class AppointmentSerializer(serializers.ModelSerializer):
    client_details = UserProfileSerializer(source='client', read_only=True)
    business_details = BusinessSerializer(source='business', read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'client', 'client_details', 'business', 'business_details', 
                  'service', 'service_details', 'date', 'start_time', 'end_time', 
                  'status', 'status_display', 'notes', 'created_at']
        
        # FIX 28/05/2025 -> ADDED 'client' in read only fields
        read_only_fields = ['id', 'client', 'client_details', 'business_details', 'service_details', 
                           'status_display', 'created_at', 'end_time']  # end_time is calculated


    def get_status_display(self, obj):
        return dict(Appointment.STATUS_CHOICES).get(obj.status, obj.status)


    def validate(self, attrs):
        if 'service' in attrs and 'start_time' in attrs and 'date' in attrs:
            service = attrs['service']
            start_datetime = datetime.combine(attrs['date'], attrs['start_time'])
            end_datetime = start_datetime + timedelta(minutes=service.duration)
            attrs['end_time'] = end_datetime.time()
        if self.instance and set(attrs.keys()).issubset({'status', 'notes'}):
            return attrs
        if not self.instance:
            required_fields = ['business', 'service', 'date', 'start_time']
            for field in required_fields:
                if field not in attrs:
                    raise serializers.ValidationError(f"{field} is required")
        date = attrs.get('date')
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        business = attrs.get('business')
        if date and start_time and end_time and business:
            overlapping_appointments = Appointment.objects.filter(
                business=business,
                date=date,
                status__in=['pending', 'confirmed']
            ).exclude(pk=self.instance.pk if self.instance else None)
            for appointment in overlapping_appointments:
                if (start_time < appointment.end_time and end_time > appointment.start_time):
                    raise serializers.ValidationError(
                        {"non_field_errors": ["This time slot is already booked."]})
        return attrs


    def create(self, validated_data):
        if 'end_time' not in validated_data:
            service = validated_data['service']
            start_datetime = datetime.combine(validated_data['date'], validated_data['start_time'])
            end_datetime = start_datetime + timedelta(minutes=service.duration)
            validated_data['end_time'] = end_datetime.time()
        return super().create(validated_data)