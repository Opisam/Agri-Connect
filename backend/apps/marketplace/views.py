"""Views for marketplace listings and orders."""

from typing import ClassVar

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsBuyer, IsFarmer
from apps.marketplace.filters import ListingFilter
from apps.marketplace.models import Listing, Order, ProduceCategory
from apps.marketplace.serializers import (
    ListingSerializer,
    OrderSerializer,
    ProduceCategorySerializer,
)
from apps.notifications.services import notify_order_received


class ProduceCategoryListView(ListAPIView):
    """List available produce categories (public)."""

    queryset = ProduceCategory.objects.all()
    serializer_class = ProduceCategorySerializer
    permission_classes: ClassVar[list] = [permissions.AllowAny]


class ListingListCreateView(ListCreateAPIView):
    """Browse active listings (public) or create a listing as a farmer."""

    serializer_class = ListingSerializer
    filter_backends: ClassVar[list] = [
        DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter
    ]
    filterset_class = ListingFilter
    search_fields: ClassVar[list] = ["product_name", "description", "location", "district"]
    ordering_fields: ClassVar[list] = [
        "price_per_unit", "quantity", "available_from", "created_at"
    ]
    ordering: ClassVar[list[str]] = ["-created_at"]

    def get_permissions(self):
        """Allow public reads; only farmers can create listings."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsFarmer()]

    def get_queryset(self):
        """Return active listings for everyone plus the farmer's own listings."""
        user = self.request.user
        queryset = Listing.objects.select_related("farmer", "category")
        if _is_farmer(user):
            return queryset.filter(Q(status=Listing.Statuses.ACTIVE) | Q(farmer=user))
        return queryset.filter(status=Listing.Statuses.ACTIVE)

    def perform_create(self, serializer) -> None:
        """Set the creating farmer as the listing owner."""
        serializer.save(farmer=self.request.user)


class ListingDetailView(RetrieveUpdateDestroyAPIView):
    """View a listing, or update/cancel it as its owner."""

    serializer_class = ListingSerializer

    def get_permissions(self):
        """Allow public reads; only farmers can modify listings."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsFarmer()]

    def get_queryset(self):
        """Return readable listings to everyone and own listings for writes."""
        user = self.request.user
        queryset = Listing.objects.select_related("farmer", "category")
        if self.request.method in permissions.SAFE_METHODS:
            if _is_farmer(user):
                return queryset.filter(
                    Q(farmer=user) | Q(status=Listing.Statuses.ACTIVE)
                )
            return queryset.filter(status=Listing.Statuses.ACTIVE)
        return queryset.filter(farmer=user)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the listing instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderListCreateView(ListCreateAPIView):
    """List orders for the requesting party or create an order as a buyer."""

    serializer_class = OrderSerializer

    def get_permissions(self):
        """Return results for authenticated reads; only buyers can create orders."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsBuyer()]

    def get_queryset(self):
        """Return orders placed by the buyer or on the farmer's listings."""
        user = self.request.user
        queryset = Order.objects.select_related("listing__farmer", "listing__category", "buyer")
        if _is_farmer(user):
            return queryset.filter(listing__farmer=user)
        return queryset.filter(buyer=user)

    def perform_create(self, serializer) -> None:
        """Set the creating buyer as the order owner and notify the farmer."""
        order = serializer.save(buyer=self.request.user)
        notify_order_received(order)


class OrderDetailView(RetrieveUpdateAPIView):
    """View an order, or update its status/notes as the relevant party."""

    serializer_class = OrderSerializer
    permission_classes: ClassVar[list] = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return orders involving the requesting user."""
        user = self.request.user
        return Order.objects.filter(Q(buyer=user) | Q(listing__farmer=user)).select_related(
            "listing__farmer", "listing__category", "buyer"
        )


def _is_farmer(user: User) -> bool:
    """Return True for users with the farmer role."""
    return bool(user.is_authenticated and user.is_farmer)
