"""FilterSets for the markets app."""

import django_filters

from apps.markets.models import MarketPrice


class MarketPriceFilter(django_filters.FilterSet):
    """Filter market prices by market, product, unit and date range."""

    market = django_filters.NumberFilter(field_name="market_id")
    market_name = django_filters.CharFilter(
        field_name="market__name", lookup_expr="icontains"
    )
    product = django_filters.CharFilter(lookup_expr="icontains")
    unit = django_filters.CharFilter(lookup_expr="iexact")
    start_date = django_filters.DateFilter(field_name="price_date", lookup_expr="gte")
    end_date = django_filters.DateFilter(field_name="price_date", lookup_expr="lte")

    class Meta:
        model = MarketPrice
        fields = (
            "market",
            "market_name",
            "product",
            "unit",
            "start_date",
            "end_date",
        )
