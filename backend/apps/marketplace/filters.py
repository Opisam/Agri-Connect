"""FilterSets for the marketplace app."""

import django_filters

from apps.marketplace.models import Listing


class ListingFilter(django_filters.FilterSet):
    """Filter listings by product, category, district, location and price."""

    category = django_filters.NumberFilter(field_name="category_id")
    category_name = django_filters.CharFilter(
        field_name="category__name", lookup_expr="icontains"
    )
    product = django_filters.CharFilter(
        field_name="product_name", lookup_expr="icontains"
    )
    district = django_filters.CharFilter(lookup_expr="icontains")
    location = django_filters.CharFilter(lookup_expr="icontains")
    farmer = django_filters.NumberFilter(field_name="farmer_id")
    min_price = django_filters.NumberFilter(
        field_name="price_per_unit", lookup_expr="gte"
    )
    max_price = django_filters.NumberFilter(
        field_name="price_per_unit", lookup_expr="lte"
    )

    class Meta:
        model = Listing
        fields = (
            "category",
            "category_name",
            "product",
            "district",
            "location",
            "farmer",
            "min_price",
            "max_price",
        )
