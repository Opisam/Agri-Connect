"""Admin registrations for the notifications app."""

from django.contrib import admin

from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin for in-app notifications."""

    list_display = ("title", "user", "notification_type", "is_read", "created_at")
    list_filter = ("is_read", "notification_type")
    search_fields = ("title", "message", "user__username", "user__full_name")
    readonly_fields = ("created_at", "updated_at")
    list_select_related = ("user",)
