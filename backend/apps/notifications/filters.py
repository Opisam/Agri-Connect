"""Filters for the notifications app."""

from django_filters import rest_framework as filters

from apps.notifications.models import Notification


class NotificationFilter(filters.FilterSet):
    """Filter notifications by read state and type."""

    is_read = filters.BooleanFilter(field_name="is_read")
    notification_type = filters.CharFilter(field_name="notification_type", lookup_expr="iexact")

    class Meta:
        model = Notification
        fields = ("is_read", "notification_type")
