"""Markets and historical market prices for agricultural produce."""

from decimal import Decimal
from typing import ClassVar

from django.core.validators import MinValueValidator
from django.db import models


class Market(models.Model):
    """A physical agricultural marketplace location."""

    name = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["name"]
        verbose_name = "market"
        verbose_name_plural = "markets"

    def __str__(self) -> str:
        return self.name


class MarketPrice(models.Model):
    """A dated price for a product at a specific market.

    Old price rows are never overwritten, preserving a view of history.
    """

    product = models.CharField(max_length=100, db_index=True)
    market = models.ForeignKey(
        Market,
        on_delete=models.CASCADE,
        related_name="prices",
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit = models.CharField(max_length=20, default="kg")
    price_date = models.DateField(db_index=True)
    source = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-price_date", "-id"]
        constraints: ClassVar[list] = [
            models.CheckConstraint(
                condition=models.Q(price__gt=0),
                name="market_price_positive",
            ),
            models.UniqueConstraint(
                fields=["market", "product", "price_date", "unit"],
                name="unique_market_price_per_day",
            ),
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=["market", "price_date", "product"],
                name="market_price_history_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product} at {self.market}: {self.price} {self.unit} on {self.price_date}"
