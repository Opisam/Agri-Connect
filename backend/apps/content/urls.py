"""URL configuration for the content app."""

from django.urls import path

from apps.content.views import (
    ArticleDetailView,
    ArticleListCreateView,
    ContentCategoryListView,
)

app_name = "content"

urlpatterns = [
    path("categories/", ContentCategoryListView.as_view(), name="category-list"),
    path("articles/", ArticleListCreateView.as_view(), name="article-list"),
    path("articles/<int:pk>/", ArticleDetailView.as_view(), name="article-detail"),
]
