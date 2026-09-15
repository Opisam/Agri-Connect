"""Serializers for content categories and articles."""

from rest_framework import serializers

from apps.content.models import Article, ContentCategory


class ContentCategorySerializer(serializers.ModelSerializer):
    """Serialize a content category."""

    class Meta:
        model = ContentCategory
        fields = ("id", "name", "slug", "description")


class ArticleSerializer(serializers.ModelSerializer):
    """Serialize an agricultural article."""

    category_name = serializers.CharField(
        source="category.name", read_only=True, allow_null=True
    )
    author_name = serializers.CharField(
        source="author.username", read_only=True, allow_null=True
    )

    class Meta:
        model = Article
        fields = (
            "id",
            "category",
            "category_name",
            "author",
            "author_name",
            "title",
            "slug",
            "content",
            "image",
            "is_published",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "author_name", "created_at", "updated_at")
