from businesses.models import BusinessHours, BusinessTimePeriod

print("Fixing existing business hours...")

for hours in BusinessHours.objects.all():
    if not hours.time_periods_set.exists() and not hours.is_closed:
        BusinessTimePeriod.objects.create(
            business_hours=hours,
            start_time='09:00',
            end_time='17:00',
            period_name='Full Day'
        )
        print(f"Fixed {hours.business.name} - {hours.get_day_display()}")

print("Done!")