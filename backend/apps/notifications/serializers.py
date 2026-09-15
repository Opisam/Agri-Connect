"""Serializers for in-app notifications."""

from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serialize an in-app notification."""

    class Meta:
        model = Notification
        fields = (
            "id",
            "user",
            "notification_type",
            "title",
            "message",
            "is_read",
            "related_object_type",
            "related_object_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "notification_type",
            "title",
            "message",
            "related_object_type",
            "related_object_id",
            "created_at",
            "updated_at",
        )


class NotificationMarkReadSerializer(serializers.ModelSerializer):
    """Allow toggling is_read on a notification."""

    class Meta:
        model = Notification
        fields = ("id", "is_read")
        read_only_fields = ("id",)
