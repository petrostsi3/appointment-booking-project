from django.core.management.base import BaseCommand
from django.utils.text import slugify
from businesses.models import BusinessCategory

class Command(BaseCommand):
    help = 'Create initial business categories with icons and colors'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing categories and create fresh ones'
        )
    
    def handle(self, *args, **options):
        if options['reset']:
            BusinessCategory.objects.all().delete()
            self.stdout.write(self.style.WARNING("Deleted existing categories"))
        
        categories = [
            {
                'name': 'Hair Salon',
                'description': 'Hair cutting, styling, coloring, and treatments',
                'icon_class': 'fas fa-cut',
                'color': '#e91e63',
                'sort_order': 1
            },
            {
                'name': 'Barbershop',
                'description': 'Traditional men\'s grooming and haircuts',
                'icon_class': 'fas fa-user-tie',
                'color': '#795548',
                'sort_order': 2
            },
            {
                'name': 'Nail Salon',
                'description': 'Manicures, pedicures, and nail art services',
                'icon_class': 'far fa-hand-paper',
                'color': '#f06292',
                'sort_order': 3
            },
            {
                'name': 'Beauty Spa',
                'description': 'Facial treatments, massages, and wellness services',
                'icon_class': 'fas fa-spa',
                'color': '#4caf50',
                'sort_order': 4
            },
            {
                'name': 'Medical Practice',
                'description': 'Doctors, dentists, and medical professionals',
                'icon_class': 'fas fa-user-md',
                'color': '#2196f3',
                'sort_order': 5
            },
            {
                'name': 'Dental Care',
                'description': 'Dental checkups, cleanings, and treatments',
                'icon_class': 'fas fa-tooth',
                'color': '#00bcd4',
                'sort_order': 6
            },
            {
                'name': 'Fitness & Wellness',
                'description': 'Personal training, yoga, and fitness coaching',
                'icon_class': 'fas fa-dumbbell',
                'color': '#ff9800',
                'sort_order': 7
            },
            {
                'name': 'Pet Grooming',
                'description': 'Pet care, grooming, and veterinary services',
                'icon_class': 'fas fa-paw',
                'color': '#9c27b0',
                'sort_order': 8
            },
            {
                'name': 'Massage Therapy',
                'description': 'Therapeutic and relaxation massage services',
                'icon_class': 'fas fa-hands',
                'color': '#607d8b',
                'sort_order': 9
            },
            {
                'name': 'Automotive Services',
                'description': 'Car maintenance, repair, and detailing',
                'icon_class': 'fas fa-car',
                'color': '#424242',
                'sort_order': 10
            },
            {
                'name': 'Consultation Services',
                'description': 'Business consulting, legal advice, and professional services',
                'icon_class': 'fas fa-handshake',
                'color': '#3f51b5',
                'sort_order': 11
            },
            {
                'name': 'Photography',
                'description': 'Photo sessions, event photography, and portraits',
                'icon_class': 'fas fa-camera',
                'color': '#ff5722',
                'sort_order': 12
            },
            {
                'name': 'Home Services',
                'description': 'Cleaning, maintenance, and home improvement',
                'icon_class': 'fas fa-home',
                'color': '#8bc34a',
                'sort_order': 13
            },
            {
                'name': 'Education & Tutoring',
                'description': 'Private lessons, tutoring, and educational services',
                'icon_class': 'fas fa-graduation-cap',
                'color': '#ffc107',
                'sort_order': 14
            },
            {
                'name': 'Other Services',
                'description': 'Miscellaneous professional services',
                'icon_class': 'fas fa-briefcase',
                'color': '#9e9e9e',
                'sort_order': 15
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for cat_data in categories:
            slug = slugify(cat_data['name'])
            category, created = BusinessCategory.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                    'icon_class': cat_data['icon_class'],
                    'color': cat_data['color'],
                    'sort_order': cat_data['sort_order']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f"Created: {category.name}")
            else:
                category.description = cat_data['description']
                category.icon_class = cat_data['icon_class']
                category.color = cat_data['color']
                category.sort_order = cat_data['sort_order']
                category.save()
                updated_count += 1
                self.stdout.write(f"Updated: {category.name}")
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nCategories setup complete!\n"
                f"Created: {created_count} new categories\n"
                f"Updated: {updated_count} existing categories\n"
                f"Total: {BusinessCategory.objects.count()} categories available"
            )
        )