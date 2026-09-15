"""Mark marketplace listings as EXPIRED when their available_from window has lapsed."""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.marketplace.models import Listing


class Command(BaseCommand):
    """Expire ACTIVE listings older than 90 days from available_from."""

    help = "Mark ACTIVE listings as EXPIRED when available_from was more than 90 days ago."

    def handle(self, *args, **options) -> None:
        """Execute the expiry sweep."""
        cutoff = timezone.localdate() - timedelta(days=90)
        updated = Listing.objects.filter(
            status=Listing.Statuses.ACTIVE,
            available_from__lt=cutoff,
        ).update(status=Listing.Statuses.EXPIRED)
        self.stdout.write(f"Expired {updated} listing(s).")
