from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin configuration for the custom User model."""

    fieldsets = (
        *UserAdmin.fieldsets,
        (
            "AgriConnect",
            {"fields": ("role", "full_name", "phone", "location", "district", "profile_image")},
        ),
    )
    add_fieldsets = (
        *UserAdmin.add_fieldsets,
        ("AgriConnect", {"fields": ("role", "full_name", "phone", "location", "district")}),
    )
    list_display = ("username", "full_name", "email", "phone", "role", "is_active", "date_joined")
    list_filter = ("role", "is_active", "is_staff")
