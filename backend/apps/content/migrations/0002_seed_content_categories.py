"""Seed the baseline content categories."""

from django.db import migrations

CATEGORIES = [
    ("Crops", "crops", "Guides on crop planting, care and harvesting."),
    ("Livestock", "livestock", "Advice for raising cattle, goats, poultry and more."),
    ("Farming guides", "farming-guides", "Step-by-step guides for smallholder farming."),
    ("Pest information", "pest-information", "Identifying and managing crop pests."),
    ("Disease information", "disease-information", "Spotting and preventing crop and livestock diseases."),
]


def seed_categories(apps, schema_editor):
    """Insert the baseline content categories if they are missing."""
    ContentCategory = apps.get_model("content", "ContentCategory")
    for name, slug, description in CATEGORIES:
        ContentCategory.objects.update_or_create(
            slug=slug, defaults={"name": name, "description": description}
        )


def unseed_categories(apps, schema_editor):
    """Remove the seeded baseline categories."""
    ContentCategory = apps.get_model("content", "ContentCategory")
    ContentCategory.objects.filter(slug__in=[slug for _, slug, _ in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
