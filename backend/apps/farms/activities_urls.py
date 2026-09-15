"""Crop activity detail endpoints, mounted at /api/v1/activities/."""

from django.urls import path

from apps.farms.views import CropActivityDetailView, CropActivityRestoreView

urlpatterns = [
    path("<int:pk>/", CropActivityDetailView.as_view(), name="crop-activity-detail"),
    path("<int:pk>/restore/", CropActivityRestoreView.as_view(), name="crop-activity-restore"),
]
