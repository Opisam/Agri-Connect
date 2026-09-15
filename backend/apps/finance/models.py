"""Expense, Harvest and Sale models for AgriConnect Uganda."""

from decimal import Decimal
from typing import ClassVar

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.farms.models import Farm, SoftDeleteModel


class ExpenseCategory(models.TextChoices):
    """Valid expense categories for farm expenses."""

    SEEDS = "Seeds", "Seeds"
    FERTILIZER = "Fertilizer", "Fertilizer"
    PESTICIDES = "Pesticides", "Pesticides"
    LABOUR = "Labour", "Labour"
    TRANSPORT = "Transport", "Transport"
    EQUIPMENT = "Equipment", "Equipment"
    FEED = "Feed", "Feed"
    VETERINARY = "Veterinary", "Veterinary"
    LAND_PREPARATION = "Land preparation", "Land preparation"
    OTHER = "Other", "Other"


class Expense(SoftDeleteModel):
    """A recorded cost incurred on a farm or crop."""

    farm = models.ForeignKey(Farm, on_delete=models.PROTECT, related_name="expenses")
    crop = models.ForeignKey(
        "farms.Crop",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )
    category = models.CharField(max_length=30, choices=ExpenseCategory.choices)
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    date = models.DateField()
    description = models.CharField(max_length=300, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-date"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0), name="expense_amount_positive"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.category} - {self.amount}"


class Harvest(SoftDeleteModel):
    """A recorded yield from a crop."""

    farm = models.ForeignKey(Farm, on_delete=models.PROTECT, related_name="harvests")
    crop = models.ForeignKey(
        "farms.Crop", on_delete=models.PROTECT, related_name="harvests"
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit = models.CharField(max_length=20, default="kg")
    harvest_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-harvest_date"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0), name="harvest_quantity_positive"
            ),
        ]

    def __str__(self) -> str:
        return f"Harvest {self.quantity} {self.unit} on {self.harvest_date}"


class Sale(SoftDeleteModel):
    """A recorded transaction where a farmer sells produce."""

    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sales"
    )
    farm = models.ForeignKey(Farm, on_delete=models.PROTECT, related_name="sales")
    crop = models.ForeignKey(
        "farms.Crop",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit = models.CharField(max_length=20, default="kg")
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    buyer_name = models.CharField(max_length=200, blank=True)
    buyer_contact = models.CharField(max_length=50, blank=True)
    sale_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-sale_date"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=0),
                name="sale_total_non_negative",
            ),
        ]

    def save(self, *args, **kwargs):
        """Calculate total_amount before saving."""
        self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Sale {self.total_amount} on {self.sale_date}"
