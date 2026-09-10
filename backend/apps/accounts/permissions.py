"""Role-based permission classes for AgriConnect."""

from rest_framework import permissions

from apps.accounts.models import User


class IsFarmer(permissions.BasePermission):
    """Allow access only to users with the FARMER role."""

    message = "Only farmers can perform this action."

    def has_permission(self, request, view) -> bool:
        """Return True for authenticated farmers."""
        return bool(request.user and request.user.is_authenticated and request.user.is_farmer)


class IsBuyer(permissions.BasePermission):
    """Allow access only to users with the BUYER role."""

    message = "Only buyers can perform this action."

    def has_permission(self, request, view) -> bool:
        """Return True for authenticated buyers."""
        return bool(request.user and request.user.is_authenticated and request.user.is_buyer)


class IsAdmin(permissions.BasePermission):
    """Allow access only to administrators (role ADMIN or superuser)."""

    message = "Only administrators can perform this action."

    def has_permission(self, request, view) -> bool:
        """Return True for administrators and staff."""
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role == User.Roles.ADMIN or user.is_superuser or user.is_staff)
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Read access for authenticated users, write access only for admins."""

    message = "Only administrators can modify this resource."

    def has_permission(self, request, view) -> bool:
        """Allow authenticated reads and admin-only writes."""
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return user.role == User.Roles.ADMIN or user.is_superuser or user.is_staff
