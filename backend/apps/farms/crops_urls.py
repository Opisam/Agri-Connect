"""Crop and nested crop-activity endpoints, mounted at /api/v1/crops/."""

from django.urls import path

from apps.farms.views import (
    CropActivityListCreateView,
    CropDetailView,
    CropListCreateView,
    CropRestoreView,
)

urlpatterns = [
    path("", CropListCreateView.as_view(), name="crop-list-create"),
    path("<int:pk>/", CropDetailView.as_view(), name="crop-detail"),
    path("<int:pk>/restore/", CropRestoreView.as_view(), name="crop-restore"),
    path(
        "<int:crop_id>/activities/",
        CropActivityListCreateView.as_view(),
        name="crop-activity-list-create",
    ),
]
