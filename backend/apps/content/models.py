"""Content categories and agricultural articles."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify

from apps.farms.models import SoftDeleteModel

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


def validate_article_image(value) -> None:
    """Reject article images larger than 10 MB."""
    if value.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError("Article image must be at most 10 MB.")


class ContentCategory(models.Model):
    """A database-driven grouping for agricultural content."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "content category"
        verbose_name_plural = "content categories"

    def __str__(self) -> str:
        return self.name


class Article(SoftDeleteModel):
    """An agricultural guide or informational article."""

    category = models.ForeignKey(
        ContentCategory,
        on_delete=models.PROTECT,
        related_name="articles",
        blank=True,
        null=True,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="articles",
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=330, unique=True, blank=True)
    content = models.TextField()
    image = models.ImageField(
        upload_to="articles/",
        blank=True,
        null=True,
        validators=[validate_article_image],
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "article"
        verbose_name_plural = "articles"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        """Assign a unique slug from the title when one is missing."""
        if not self.slug:
            self.slug = self._generate_slug(self.title)
        super().save(*args, **kwargs)

    def _generate_slug(self, value: str) -> str:
        """Build a slug guaranteed to be unique against existing articles."""
        base = (slugify(value) or "article")[:320]
        slug = base
        counter = 1
        while Article.all_objects.filter(slug=slug).exists():
            suffix = f"-{counter}"
            slug = f"{base[: 320 - len(suffix)]}{suffix}"
            counter += 1
        return slug
