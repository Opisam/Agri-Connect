"""Field detail endpoints, mounted at /api/v1/fields/."""

from django.urls import path

from apps.farms.views import FieldDetailView, FieldRestoreView

urlpatterns = [
    path("<int:pk>/", FieldDetailView.as_view(), name="field-detail"),
    path("<int:pk>/restore/", FieldRestoreView.as_view(), name="field-restore"),
]
