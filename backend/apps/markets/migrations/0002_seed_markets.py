# Generated manually to seed the initial Ugandan markets.

from django.db import migrations

SEED_MARKETS = [
    ("Kampala", "Kampala", "Nakasero Market"),
    ("Lira", "Lira", "Lira Main Market"),
    ("Gulu", "Gulu", "Gulu Main Market"),
    ("Mbarara", "Mbarara", "Mbarara Central Market"),
    ("Jinja", "Jinja", "Jinja Main Market"),
]


def seed_markets(apps, schema_editor):
    """Create the initial markets."""
    Market = apps.get_model("markets", "Market")
    Market.objects.bulk_create(
        Market(name=name, district=district, location=location, is_active=True)
        for name, district, location in SEED_MARKETS
    )


def unseed_markets(apps, schema_editor):
    """Remove the seeded markets."""
    Market = apps.get_model("markets", "Market")
    Market.objects.filter(name__in=[name for name, _, _ in SEED_MARKETS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("markets", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_markets, unseed_markets),
    ]
