"""Admin configuration for the finance app."""

from django.contrib import admin

from apps.finance.models import Expense, Harvest, Sale


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    """Admin interface for managing expenses."""

    list_display = ("id", "farm", "category", "amount", "date")
    list_filter = ("category", "date")
    search_fields = ("description",)


@admin.register(Harvest)
class HarvestAdmin(admin.ModelAdmin):
    """Admin interface for managing harvests."""

    list_display = ("id", "farm", "crop", "quantity", "unit", "harvest_date")
    list_filter = ("harvest_date",)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    """Admin interface for managing sales."""

    list_display = (
        "id",
        "farmer",
        "farm",
        "quantity",
        "unit_price",
        "total_amount",
        "sale_date",
    )
    list_filter = ("sale_date",)
