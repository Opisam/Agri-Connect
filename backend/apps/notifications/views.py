"""Views for listing, marking and counting in-app notifications."""

from typing import ClassVar

from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.filters import NotificationFilter
from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationMarkReadSerializer,
    NotificationSerializer,
)


class NotificationListView(ListAPIView):
    """List the requesting user's notifications."""

    serializer_class = NotificationSerializer
    permission_classes: ClassVar[list] = [permissions.IsAuthenticated]
    filter_backends: ClassVar[list] = [DjangoFilterBackend]
    filterset_class = NotificationFilter

    def get_queryset(self) -> QuerySet[Notification]:
        """Return only the requesting user's notifications."""
        return Notification.objects.filter(user=self.request.user)


class NotificationUnreadCountView(APIView):
    """Return the requesting user's unread notification count."""

    permission_classes: ClassVar[list] = [permissions.IsAuthenticated]

    def get(self, request):
        """Return the unread count for the requesting user."""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})


class NotificationDetailView(RetrieveUpdateAPIView):
    """View a notification or toggle its read state."""

    serializer_class = NotificationMarkReadSerializer
    permission_classes: ClassVar[list] = [permissions.IsAuthenticated]

    def get_queryset(self) -> QuerySet[Notification]:
        """Return only the requesting user's notifications."""
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkAllReadView(APIView):
    """Mark every notification of the requesting user as read."""

    permission_classes: ClassVar[list] = [permissions.IsAuthenticated]

    def post(self, request):
        """Mark all unread notifications as read and return how many were updated."""
        marked = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({"marked": marked}, status=status.HTTP_200_OK)
