"""Views for markets, logged prices and price history."""

from typing import ClassVar

from django.db.models import Max
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin
from apps.markets.filters import MarketPriceFilter
from apps.markets.models import Market, MarketPrice
from apps.markets.serializers import MarketPriceSerializer, MarketSerializer


class AdminWriteOrPublicReadMixin:
    """Allow public reads and admin-only writes."""

    def get_permissions(self):
        """Allow public reads and admin-only writes."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdmin()]


class MarketListCreateView(AdminWriteOrPublicReadMixin, ListCreateAPIView):
    """List active markets publicly or manage them as an administrator."""

    serializer_class = MarketSerializer

    def get_queryset(self):
        """Return active markets for everyone and all markets for admins."""
        if _is_admin(self.request.user):
            return Market.objects.all()
        return Market.objects.filter(is_active=True)


class MarketDetailView(AdminWriteOrPublicReadMixin, RetrieveUpdateDestroyAPIView):
    """View a market, or manage it as an administrator."""

    serializer_class = MarketSerializer

    def get_queryset(self):
        """Return active markets for everyone and all markets for admins."""
        if _is_admin(self.request.user):
            return Market.objects.all()
        return Market.objects.filter(is_active=True)


class MarketPriceListCreateView(AdminWriteOrPublicReadMixin, ListCreateAPIView):
    """List price history publicly or record a new price as an administrator."""

    serializer_class = MarketPriceSerializer
    filter_backends: ClassVar[list] = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = MarketPriceFilter
    search_fields: ClassVar[list] = ["product", "market__name", "source"]
    ordering_fields: ClassVar[list] = ["price", "price_date", "product"]
    ordering: ClassVar[list[str]] = ["-price_date", "-id"]

    def get_queryset(self):
        """Return all prices for admins and active-market prices for others."""
        queryset = MarketPrice.objects.select_related("market")
        if not _is_admin(self.request.user):
            queryset = queryset.filter(market__is_active=True)
        return queryset


class MarketPriceDetailView(AdminWriteOrPublicReadMixin, RetrieveUpdateDestroyAPIView):
    """View a price, or manage it as an administrator."""

    serializer_class = MarketPriceSerializer

    def get_queryset(self):
        """Return all prices for admins and active-market prices for others."""
        queryset = MarketPrice.objects.select_related("market")
        if not _is_admin(self.request.user):
            queryset = queryset.filter(market__is_active=True)
        return queryset


class MarketPriceCurrentListView(ListAPIView):
    """Return the latest price for each product at each market."""

    serializer_class = MarketPriceSerializer
    permission_classes: ClassVar[list] = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        """Return the most recent price row per product, market and unit."""
        latest_ids = (
            MarketPrice.objects.values("product", "market_id", "unit")
            .annotate(latest=Max("id"))
            .values_list("latest", flat=True)
        )
        return (
            MarketPrice.objects.filter(id__in=latest_ids, market__is_active=True)
            .select_related("market")
            .order_by("market__name", "product")
        )


class MarketPriceHistoryListView(ListAPIView):
    """Return the ascending price history for a product at a market."""

    serializer_class = MarketPriceSerializer
    permission_classes: ClassVar[list] = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        """Return active-market prices filtered by product, market and date."""
        queryset = MarketPrice.objects.select_related("market").filter(
            market__is_active=True
        )
        product = self.request.query_params.get("product", "").strip()
        if product:
            queryset = queryset.filter(product__icontains=product)
        market = self.request.query_params.get("market")
        if market:
            queryset = queryset.filter(market_id=market)
        start_date = self.request.query_params.get("start_date")
        if start_date:
            queryset = queryset.filter(price_date__gte=start_date)
        end_date = self.request.query_params.get("end_date")
        if end_date:
            queryset = queryset.filter(price_date__lte=end_date)
        return queryset.order_by("price_date", "id")


def _is_admin(user: User) -> bool:
    """Return True for administrators, staff and superusers."""
    return bool(
        user.is_authenticated
        and (user.role == User.Roles.ADMIN or user.is_staff or user.is_superuser)
    )
