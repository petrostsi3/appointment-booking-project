from django.core.management.base import BaseCommand
from appointments.utils import check_and_send_reminders

class Command(BaseCommand):
    help = 'Send email reminders for upcoming appointments'

    def handle(self, *args, **options):
        self.stdout.write('Checking for appointments to send reminders...')
        check_and_send_reminders()
        self.stdout.write(self.style.SUCCESS('Successfully sent appointment reminders'))