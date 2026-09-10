"""Custom user model for AgriConnect Uganda."""

from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

from apps.accounts.utils import validate_ugandan_phone


class User(AbstractUser):
    """Base user with role-based access control.

    Roles: FARMER, BUYER, ADMIN (is_superuser / ADMIN).
    """

    class Roles(models.TextChoices):
        FARMER = "FARMER", "Farmer"
        BUYER = "BUYER", "Buyer"
        ADMIN = "ADMIN", "Administrator"

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.BUYER)

    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                r"^\+256\d{9}$",
                "Enter a valid Ugandan phone number, e.g. +256701234567",
            )
        ],
    )
    location = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to="profiles/%Y/%m/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering: ClassVar[list[str]] = ["-date_joined"]

    def __str__(self) -> str:
        return self.full_name or self.username or self.email

    @property
    def is_farmer(self) -> bool:
        """Return True if the user has the farmer role."""
        return self.role == self.Roles.FARMER

    @property
    def is_buyer(self) -> bool:
        """Return True if the user has the buyer role."""
        return self.role == self.Roles.BUYER

    def save(self, *args, **kwargs):
        """Normalize the phone number before saving."""
        if self.phone:
            self.phone = validate_ugandan_phone(self.phone)
        super().save(*args, **kwargs)
