"""Views for farms, fields, crops and crop activities."""

from typing import ClassVar

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsFarmer
from apps.farms.models import Crop, CropActivity, Farm, Field
from apps.farms.serializers import (
    CropActivitySerializer,
    CropSerializer,
    FarmSerializer,
    FieldSerializer,
)


def _is_admin(user: User) -> bool:
    """Return True for administrators, staff and superusers."""
    return bool(
        user.is_authenticated
        and (user.role == User.Roles.ADMIN or user.is_staff or user.is_superuser)
    )


class FarmerWriteOrReadMixin:
    """Require the FARMER role for write methods only."""

    def get_permissions(self):
        """Allow authenticated reads and farmer-only writes."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsFarmer()]


class FarmListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List the requesting farmer's farms or create a new farm."""

    serializer_class = FarmSerializer

    def get_queryset(self):
        """Return owned farms for regular users, all farms for admins."""
        user = self.request.user
        if _is_admin(user):
            return Farm.all_objects.select_related("owner").all()
        return Farm.objects.filter(owner=user).select_related("owner").all()

    def perform_create(self, serializer) -> None:
        """Set the creating farmer as the farm owner."""
        serializer.save(owner=self.request.user)


class FarmDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single farm."""

    serializer_class = FarmSerializer

    def get_queryset(self):
        """Restrict access to the farm owner (or all farms for admins)."""
        user = self.request.user
        if _is_admin(user):
            return Farm.all_objects.filter(pk=self.kwargs["pk"]).select_related("owner")
        return Farm.objects.filter(owner=user, pk=self.kwargs["pk"]).select_related("owner")

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the farm instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FieldListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List a farm's fields or create a new field within it."""

    serializer_class = FieldSerializer

    def get_farm(self) -> Farm:
        """Return the farm from the URL that the user may access."""
        user = self.request.user
        queryset = (
            Farm.all_objects
            if _is_admin(user)
            else Farm.objects.filter(owner=user)
        )
        return get_object_or_404(queryset, pk=self.kwargs["farm_id"])

    def get_queryset(self):
        """Return the farm's fields (including deleted ones for admins)."""
        farm = self.get_farm()
        if _is_admin(self.request.user):
            return Field.all_objects.filter(farm=farm)
        return farm.fields.all()

    def perform_create(self, serializer) -> None:
        """Bind the new field to the farm from the URL."""
        serializer.save(farm=self.get_farm())


class FieldDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single field."""

    serializer_class = FieldSerializer

    def get_queryset(self):
        """Restrict access to fields in farms the user owns."""
        user = self.request.user
        queryset = (
            Field.all_objects if _is_admin(user) else Field.objects.filter(farm__owner=user)
        )
        return queryset.filter(pk=self.kwargs["pk"])

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the field instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CropListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List the farmer's crops or create a crop (farm auto-resolved)."""

    serializer_class = CropSerializer

    def get_queryset(self):
        """Return crops on the user's farms (all crops for admins)."""
        user = self.request.user
        queryset = Crop.all_objects if _is_admin(user) else Crop.objects.filter(
            farm__owner=user
        )
        return queryset.select_related("farm", "field")

    def get_serializer_context(self):
        """Attach the request so field ownership can be validated."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class CropDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single crop."""

    serializer_class = CropSerializer

    def get_queryset(self):
        """Restrict access to crops on the user's farms."""
        user = self.request.user
        queryset = Crop.all_objects if _is_admin(user) else Crop.objects.filter(
            farm__owner=user
        )
        return queryset.filter(pk=self.kwargs["pk"]).select_related("farm", "field")

    def get_serializer_context(self):
        """Attach the request so field ownership can be validated."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the crop instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CropActivityListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List a crop's activities or record a new activity on it."""

    serializer_class = CropActivitySerializer

    def get_crop(self) -> Crop:
        """Return the crop from the URL that the user may access."""
        user = self.request.user
        queryset = (
            Crop.all_objects
            if _is_admin(user)
            else Crop.objects.filter(farm__owner=user)
        )
        return get_object_or_404(queryset, pk=self.kwargs["crop_id"])

    def get_queryset(self):
        """Return the crop's activities (including deleted for admins)."""
        crop = self.get_crop()
        if _is_admin(self.request.user):
            return CropActivity.all_objects.filter(crop=crop)
        return crop.activities.all()

    def perform_create(self, serializer) -> None:
        """Bind the new activity to the crop from the URL."""
        serializer.save(crop=self.get_crop())


class CropActivityDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single crop activity."""

    serializer_class = CropActivitySerializer

    def get_queryset(self):
        """Restrict access to activities on the user's crops."""
        user = self.request.user
        queryset = (
            CropActivity.all_objects
            if _is_admin(user)
            else CropActivity.objects.filter(crop__farm__owner=user)
        )
        return queryset.filter(pk=self.kwargs["pk"])

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the activity instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RestoreObjectView(APIView):
    """Admin-only restore of a soft-deleted record."""

    permission_classes: ClassVar[list[type]] = [IsAdmin]
    model = None
    serializer = None

    def post(self, request, pk):
        """Restore the soft-deleted record and return its serialized form."""
        instance = get_object_or_404(self.model.all_objects, pk=pk)
        if not instance.is_deleted:
            return Response(
                {"message": "Record is not deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.restore()
        serializer = self.serializer(instance, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class FarmRestoreView(RestoreObjectView):
    """Restore a soft-deleted farm."""

    model = Farm
    serializer = FarmSerializer


class FieldRestoreView(RestoreObjectView):
    """Restore a soft-deleted field."""

    model = Field
    serializer = FieldSerializer


class CropRestoreView(RestoreObjectView):
    """Restore a soft-deleted crop."""

    model = Crop
    serializer = CropSerializer


class CropActivityRestoreView(RestoreObjectView):
    """Restore a soft-deleted crop activity."""

    model = CropActivity
    serializer = CropActivitySerializer
