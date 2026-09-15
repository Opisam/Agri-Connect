from typing import ClassVar

from django.contrib import admin

from apps.marketplace.models import Listing, Order, ProduceCategory


@admin.register(ProduceCategory)
class ProduceCategoryAdmin(admin.ModelAdmin):
    """Admin for produce categories."""

    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields: ClassVar[dict] = {"slug": ("name",)}


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    """Admin for marketplace listings."""

    list_display = (
        "product_name",
        "farmer",
        "category",
        "quantity_remaining",
        "unit",
        "price_per_unit",
        "status",
        "available_from",
        "created_at",
    )
    list_filter = ("status", "category", "district")
    search_fields = ("product_name", "location", "district")
    readonly_fields = ("quantity_remaining", "created_at", "updated_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin for marketplace orders."""

    list_display = (
        "id",
        "listing",
        "buyer",
        "quantity",
        "total_price",
        "status",
        "created_at",
    )
    list_filter = ("status",)
    readonly_fields = ("total_price", "created_at", "updated_at")
