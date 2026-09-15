"""Filters for the content app."""

from django_filters import rest_framework as filters

from apps.content.models import Article


class ArticleFilter(filters.FilterSet):
    """Filter articles by category or publication state."""

    category = filters.NumberFilter(field_name="category")
    category_name = filters.CharFilter(field_name="category__name", lookup_expr="icontains")
    is_published = filters.BooleanFilter(field_name="is_published")

    class Meta:
        model = Article
        fields = ("category", "category_name", "is_published")
