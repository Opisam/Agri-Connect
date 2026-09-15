"""URL configuration for the notifications app."""

from django.urls import path

from apps.notifications.views import (
    NotificationDetailView,
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationUnreadCountView,
)

app_name = "notifications"

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("unread/", NotificationUnreadCountView.as_view(), name="notification-unread"),
    path(
        "mark-all-read/",
        NotificationMarkAllReadView.as_view(),
        name="notification-mark-all-read",
    ),
    path("<int:pk>/", NotificationDetailView.as_view(), name="notification-detail"),
]
