"""Farm, Field, Crop and CropActivity models for AgriConnect Uganda."""

from decimal import Decimal
from typing import ClassVar

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet that turns bulk delete() calls into soft deletes."""

    def delete(self, hard: bool = False):
        """Soft-delete rows unless hard=True is requested."""
        if hard:
            return super().delete()
        self.update(is_deleted=True, deleted_at=timezone.now())
        return 0, {}

    def alive(self):
        """Return only records that have not been soft-deleted."""
        return self.filter(is_deleted=False)


class SoftDeleteManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Default manager excluding soft-deleted records."""

    def get_queryset(self):
        """Return only records that have not been soft-deleted."""
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Manager exposing every record, including soft-deleted ones."""


class SoftDeleteModel(models.Model):
    """Abstract base providing soft delete behaviour for resource models."""

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self) -> None:
        """Mark the record as deleted without removing it."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])

    def restore(self) -> None:
        """Undo a soft delete and clear the delete timestamp."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class Farm(SoftDeleteModel):
    """A top-level agricultural unit owned by a farmer."""

    class SizeUnits(models.TextChoices):
        ACRES = "acres", "Acres"
        HECTARES = "hectares", "Hectares"
        SQUARE_METERS = "square_meters", "Square meters"

    class FarmTypes(models.TextChoices):
        CROP_FARMING = "crop_farming", "Crop farming"
        LIVESTOCK = "livestock", "Livestock"
        MIXED_FARMING = "mixed_farming", "Mixed farming"
        POULTRY = "poultry", "Poultry farming"
        FISH_FARMING = "fish_farming", "Fish farming"
        OTHER = "other", "Other"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="farms",
    )
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=255)
    district = models.CharField(max_length=100)
    subcounty = models.CharField(max_length=100, blank=True)
    size = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    size_unit = models.CharField(max_length=20, choices=SizeUnits.choices)
    farm_type = models.CharField(max_length=30, choices=FarmTypes.choices)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(size__gt=0),
                name="farm_size_positive",
            )
        ]

    def __str__(self) -> str:
        return self.name


class Field(SoftDeleteModel):
    """A defined plot of land within a farm."""

    class SizeUnits(models.TextChoices):
        ACRES = "acres", "Acres"
        HECTARES = "hectares", "Hectares"
        SQUARE_METERS = "square_meters", "Square meters"

    farm = models.ForeignKey(Farm, on_delete=models.PROTECT, related_name="fields")
    name = models.CharField(max_length=200)
    size = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    size_unit = models.CharField(max_length=20, choices=SizeUnits.choices)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["name"]
        constraints: ClassVar[list[models.CheckConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(size__gt=0),
                name="field_size_positive",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.farm.name})"


class Crop(SoftDeleteModel):
    """A planted crop record linked to a specific field and its farm."""

    class CropTypes(models.TextChoices):
        MAIZE = "maize", "Maize"
        BEANS = "beans", "Beans"
        COFFEE = "coffee", "Coffee"
        MATOOKE = "matooke", "Matooke"
        GROUNDNUTS = "groundnuts", "Groundnuts"
        MILLET = "millet", "Millet"
        RICE = "rice", "Rice"
        CASSAVA = "cassava", "Cassava"
        SWEET_POTATO = "sweet_potato", "Sweet potato"
        IRISH_POTATO = "irish_potato", "Irish potato"
        SUNFLOWER = "sunflower", "Sunflower"
        SESAME = "sesame", "Sesame"
        SORGHUM = "sorghum", "Sorghum"
        HORTICULTURE = "horticulture", "Horticulture"
        OTHER = "other", "Other"

    class Statuses(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        PLANTED = "PLANTED", "Planted"
        GROWING = "GROWING", "Growing"
        READY_FOR_HARVEST = "READY_FOR_HARVEST", "Ready for harvest"
        HARVESTED = "HARVESTED", "Harvested"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    farm = models.ForeignKey(Farm, on_delete=models.PROTECT, related_name="crops")
    field = models.ForeignKey(Field, on_delete=models.PROTECT, related_name="crops")
    crop_type = models.CharField(max_length=30, choices=CropTypes.choices)
    variety = models.CharField(max_length=150, blank=True)
    planting_date = models.DateField(blank=True, null=True)
    expected_harvest_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=30, choices=Statuses.choices, default=Statuses.PLANNED)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_crop_type_display()} in {self.field.name}"


class CropActivity(SoftDeleteModel):
    """A completed farming activity recorded against a crop."""

    class ActivityTypes(models.TextChoices):
        LAND_PREPARATION = "land_preparation", "Land preparation"
        PLANTING = "planting", "Planting"
        WEEDING = "weeding", "Weeding"
        FERTILIZATION = "fertilization", "Fertilization"
        PEST_CONTROL = "pest_control", "Pest control"
        IRRIGATION = "irrigation", "Irrigation"
        HARVESTING = "harvesting", "Harvesting"
        OTHER = "other", "Other"

    crop = models.ForeignKey(Crop, on_delete=models.PROTECT, related_name="activities")
    activity_type = models.CharField(max_length=30, choices=ActivityTypes.choices)
    date = models.DateField()
    description = models.CharField(max_length=300, blank=True)
    cost = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-date"]

    def __str__(self) -> str:
        return f"{self.get_activity_type_display()} on {self.date}"
