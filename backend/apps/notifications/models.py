"""In-app notification model for order and system events."""

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """An in-app notification delivered to a user."""

    class Types(models.TextChoices):
        ORDER_RECEIVED = "ORDER_RECEIVED", "Order received"
        ORDER_ACCEPTED = "ORDER_ACCEPTED", "Order accepted"
        ORDER_REJECTED = "ORDER_REJECTED", "Order rejected"
        ORDER_COMPLETED = "ORDER_COMPLETED", "Order completed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=32, choices=Types.choices)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    related_object_type = models.CharField(max_length=20, blank=True)
    related_object_id = models.PositiveIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: tuple[str, ...] = ("-created_at",)
        indexes: tuple[models.Index, ...] = (
            models.Index(fields=["user", "is_read"], name="notif_user_unread_idx"),
        )
        verbose_name = "notification"
        verbose_name_plural = "notifications"

    def __str__(self) -> str:
        return f"[{self.notification_type}] {self.title}"

    def mark_read(self) -> None:
        """Mark the notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=["is_read", "updated_at"])
