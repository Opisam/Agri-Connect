
from django.contrib import admin

from apps.markets.models import Market, MarketPrice


@admin.register(Market)
class MarketAdmin(admin.ModelAdmin):
    """Admin for markets."""

    list_display = ("name", "district", "location", "status", "created_at")
    list_filter = ("is_active", "district")
    search_fields = ("name", "district", "location")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Status")
    def status(self, obj: Market) -> str:
        """Display a human-readable market status."""
        return "Active" if obj.is_active else "Inactive"


@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    """Admin for market prices."""

    list_display = (
        "product",
        "market",
        "price",
        "unit",
        "price_date",
        "source",
        "created_at",
    )
    list_filter = ("market", "price_date")
    search_fields = ("product", "market__name", "source")
    autocomplete_fields = ("market",)
    readonly_fields = ("created_at", "updated_at")
