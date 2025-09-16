from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'business', 'service', 'date', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'date', 'business')
    search_fields = ('client__username', 'client__email', 'business__name')
    date_hierarchy = 'date'
