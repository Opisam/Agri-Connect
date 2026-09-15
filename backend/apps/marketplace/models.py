"""Produce categories, listings and orders for the marketplace."""

from decimal import Decimal
from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from apps.farms.models import SoftDeleteModel

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


def validate_listing_image(value) -> None:
    """Reject listing images larger than 10 MB."""
    if value.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError("Listing image must be at most 10 MB.")


class ProduceCategory(models.Model):
    """A database-driven grouping for agricultural produce."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["name"]
        verbose_name = "produce category"
        verbose_name_plural = "produce categories"

    def __str__(self) -> str:
        return self.name


class Listing(SoftDeleteModel):
    """A farmer's offer of produce for sale on the marketplace."""

    class Statuses(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        SOLD = "SOLD", "Sold"
        EXPIRED = "EXPIRED", "Expired"
        CANCELLED = "CANCELLED", "Cancelled"

    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="listings",
    )
    product_name = models.CharField(max_length=200)
    category = models.ForeignKey(
        ProduceCategory,
        on_delete=models.PROTECT,
        related_name="listings",
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    quantity_remaining = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False,
    )
    unit = models.CharField(max_length=20, default="kg")
    price_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    location = models.CharField(max_length=255)
    district = models.CharField(max_length=100)
    available_from = models.DateField(default=timezone.localdate)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to="listings/",
        blank=True,
        null=True,
        validators=[validate_listing_image],
    )
    status = models.CharField(
        max_length=20,
        choices=Statuses.choices,
        default=Statuses.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="listing_quantity_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(price_per_unit__gt=0),
                name="listing_price_positive",
            ),
        ]

    def save(self, *args, **kwargs):
        """Initialise quantity_remaining when the listing is first created."""
        if self._state.adding:
            self.quantity_remaining = self.quantity
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.product_name} ({self.quantity_remaining} {self.unit} left)"


class Order(models.Model):
    """A buyer's order against a marketplace listing."""

    class Statuses(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    listing = models.ForeignKey(
        Listing,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    total_price = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    status = models.CharField(
        max_length=20,
        choices=Statuses.choices,
        default=Statuses.PENDING,
    )
    notes = models.TextField(blank=True)
    farmer_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="order_quantity_positive",
            ),
        ]

    def __str__(self) -> str:
        return f"Order {self.quantity} of {self.listing.product_name}"

    def save(self, *args, **kwargs):
        """Calculate total_price before saving."""
        self.total_price = self.quantity * self.listing.price_per_unit
        super().save(*args, **kwargs)

    def accept(self, farmer_notes: str | None = None) -> None:
        """Deduct quantity from the listing and mark the order accepted."""
        with transaction.atomic():
            if self.status != self.Statuses.PENDING:
                raise ValidationError("Only pending orders can be accepted.")
            listing = Listing.objects.select_for_update().get(pk=self.listing_id)
            if listing.status != Listing.Statuses.ACTIVE:
                raise ValidationError("This listing is no longer active.")
            if self.quantity > listing.quantity_remaining:
                raise ValidationError("Not enough quantity remaining on this listing.")
            listing.quantity_remaining -= self.quantity
            if listing.quantity_remaining <= 0:
                listing.quantity_remaining = Decimal("0.00")
                listing.status = Listing.Statuses.SOLD
            listing.save(update_fields=["quantity_remaining", "status", "updated_at"])
            self.status = self.Statuses.ACCEPTED
            if farmer_notes:
                self.farmer_notes = farmer_notes
            self.save(update_fields=["status", "farmer_notes", "updated_at"])

    def reject(self, farmer_notes: str | None = None) -> None:
        """Mark a pending order as rejected without touching the listing."""
        with transaction.atomic():
            if self.status != self.Statuses.PENDING:
                raise ValidationError("Only pending orders can be rejected.")
            self.status = self.Statuses.REJECTED
            if farmer_notes:
                self.farmer_notes = farmer_notes
            self.save(update_fields=["status", "farmer_notes", "updated_at"])

    def cancel(self) -> None:
        """Cancel the order, restoring any deducted quantity."""
        with transaction.atomic():
            if self.status not in (self.Statuses.PENDING, self.Statuses.ACCEPTED):
                raise ValidationError("This order can no longer be cancelled.")
            if self.status == self.Statuses.ACCEPTED:
                listing = Listing.objects.select_for_update().get(pk=self.listing_id)
                listing.quantity_remaining += self.quantity
                if listing.status == Listing.Statuses.SOLD:
                    listing.status = Listing.Statuses.ACTIVE
                listing.save(update_fields=["quantity_remaining", "status", "updated_at"])
            self.status = self.Statuses.CANCELLED
            self.save(update_fields=["status", "updated_at"])

    def complete(self) -> None:
        """Mark an accepted order as completed."""
        with transaction.atomic():
            if self.status != self.Statuses.ACCEPTED:
                raise ValidationError("Only accepted orders can be completed.")
            self.status = self.Statuses.COMPLETED
            self.save(update_fields=["status", "updated_at"])
