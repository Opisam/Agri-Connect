"""Serializers for markets and their prices."""

from django.utils import timezone
from rest_framework import serializers

from apps.markets.models import Market, MarketPrice


class MarketSerializer(serializers.ModelSerializer):
    """Serialize a market."""

    class Meta:
        model = Market
        fields = (
            "id",
            "name",
            "district",
            "location",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class MarketPriceSerializer(serializers.ModelSerializer):
    """Serialize a dated market price."""

    market_name = serializers.CharField(source="market.name", read_only=True)

    class Meta:
        model = MarketPrice
        fields = (
            "id",
            "product",
            "market",
            "market_name",
            "price",
            "unit",
            "price_date",
            "source",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "market_name", "created_at", "updated_at")

    def validate_price_date(self, value):
        """Price dates cannot be in the future."""
        if value > timezone.localdate():
            raise serializers.ValidationError("price_date cannot be in the future.")
        return value
