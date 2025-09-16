from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, AvailableTimeSlotsView, AppointmentAnalyticsView

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('appointments/available-slots/', AvailableTimeSlotsView.as_view(), name='available-slots'),
    path('analytics/', AppointmentAnalyticsView.as_view(), name='appointment-analytics'),
    path('', include(router.urls))]


        




