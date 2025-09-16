from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusinessViewSet, BusinessHoursViewSet, ServiceViewSet, AdminBusinessViewSet,
    BusinessCategoryViewSet
)

# Main router
router = DefaultRouter()
router.register(r'categories', BusinessCategoryViewSet, basename='category') 
router.register(r'', BusinessViewSet, basename='business')

urlpatterns = [
    # Router URLs FIRST
    path('', include(router.urls)),
    # Business hours endpoints
    path('<int:business_pk>/hours/', BusinessHoursViewSet.as_view({'get': 'list', 'post': 'create'}), name='business-hours-list'),
    path('<int:business_pk>/hours/<int:pk>/', BusinessHoursViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='business-hours-detail'),
    # Services endpoints
    path('<int:business_pk>/services/', ServiceViewSet.as_view({'get': 'list', 'post': 'create'}), name='business-services-list'),
    path('<int:business_pk>/services/<int:pk>/', ServiceViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='business-services-detail'),
    # Bulk update endpoint
    path('<int:business_pk>/hours/bulk_update/', 
         BusinessHoursViewSet.as_view({'post': 'bulk_update'}), 
         name='business-hours-bulk-update')]