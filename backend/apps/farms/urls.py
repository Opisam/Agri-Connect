"""URL configuration for the farms app."""

from django.urls import path

from apps.farms.views import (
    FarmDetailView,
    FarmListCreateView,
    FarmRestoreView,
    FieldListCreateView,
)

# Mounted at /api/v1/farms/
app_name = "farms"

urlpatterns = [
    path("", FarmListCreateView.as_view(), name="farm-list-create"),
    path("<int:pk>/", FarmDetailView.as_view(), name="farm-detail"),
    path("<int:pk>/restore/", FarmRestoreView.as_view(), name="farm-restore"),
    path("<int:farm_id>/fields/", FieldListCreateView.as_view(), name="field-list-create"),
]
