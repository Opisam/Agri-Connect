"""Admin registrations for the content app."""

from django.contrib import admin

from apps.content.models import Article, ContentCategory


@admin.register(ContentCategory)
class ContentCategoryAdmin(admin.ModelAdmin):
    """Admin for content categories."""

    list_display = ("name", "slug")
    search_fields = ("name", "slug")


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Admin for agricultural articles."""

    list_display = ("title", "category", "author", "is_published", "created_at")
    list_filter = ("category", "is_published")
    search_fields = ("title", "content", "category__name")
    autocomplete_fields = ("category", "author")
    list_select_related = ("category", "author")
