"""Views for content categories and articles."""

from typing import ClassVar

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin
from apps.content.filters import ArticleFilter
from apps.content.models import Article, ContentCategory
from apps.content.serializers import ArticleSerializer, ContentCategorySerializer


class AdminWriteOrPublicReadMixin:
    """Allow public reads and admin-only writes."""

    def get_permissions(self):
        """Allow public reads and admin-only writes."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdmin()]


class ContentCategoryListView(ListAPIView):
    """List content categories publicly."""

    queryset = ContentCategory.objects.all()
    serializer_class = ContentCategorySerializer
    permission_classes: ClassVar[list] = [permissions.AllowAny]


class ArticleListCreateView(AdminWriteOrPublicReadMixin, ListCreateAPIView):
    """List published articles publicly or manage them as an administrator."""

    serializer_class = ArticleSerializer
    filter_backends: ClassVar[list] = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ArticleFilter
    search_fields: ClassVar[list] = ["title", "content", "category__name"]
    ordering_fields: ClassVar[list] = ["created_at", "title"]
    ordering: ClassVar[list[str]] = ["-created_at"]

    def get_queryset(self):
        """Return all articles for admins and published articles for others."""
        queryset = Article.objects.select_related("category", "author")
        if not _is_admin(self.request.user):
            queryset = queryset.filter(is_published=True)
        return queryset

    def perform_create(self, serializer):
        """Assign the requesting admin as the article author."""
        serializer.save(author=self.request.user)


class ArticleDetailView(AdminWriteOrPublicReadMixin, RetrieveUpdateDestroyAPIView):
    """View an article, or manage it as an administrator."""

    serializer_class = ArticleSerializer

    def get_queryset(self):
        """Return all articles for admins and published articles for others."""
        queryset = Article.objects.select_related("category", "author")
        if not _is_admin(self.request.user):
            queryset = queryset.filter(is_published=True)
        return queryset

    def perform_destroy(self, instance):
        """Soft-delete the article rather than removing it permanently."""
        instance.soft_delete()


def _is_admin(user: User) -> bool:
    """Return True for administrators, staff and superusers."""
    return bool(
        user.is_authenticated
        and (user.role == User.Roles.ADMIN or user.is_staff or user.is_superuser)
    )
