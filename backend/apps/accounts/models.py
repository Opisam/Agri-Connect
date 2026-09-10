"""Custom user model for AgriConnect Uganda."""

from datetime import timedelta
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

    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)

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

    @property
    def is_locked(self) -> bool:
        """Return True while the account is in a lockout period."""
        if self.locked_until is None:
            return False
        from django.utils import timezone

        return timezone.now() < self.locked_until

    def record_failed_login(self, attempts: int = 5, duration_minutes: int = 15) -> None:
        """Increment failures and lock the account once the threshold is reached."""
        from django.utils import timezone

        self.failed_login_attempts += 1
        if self.failed_login_attempts >= attempts:
            self.locked_until = timezone.now() + timedelta(minutes=duration_minutes)
            self.failed_login_attempts = 0
        self.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])

    def reset_failed_login(self) -> None:
        """Clear failed login tracking after a successful login."""
        if self.failed_login_attempts or self.locked_until:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])

    def save(self, *args, **kwargs):
        """Normalize the phone number before saving."""
        if self.phone:
            self.phone = validate_ugandan_phone(self.phone)
        super().save(*args, **kwargs)
