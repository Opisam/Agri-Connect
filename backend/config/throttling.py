"""Custom throttle classes for endpoint-specific rate limits."""

from rest_framework.throttling import ScopedRateThrottle as DRFScopedRateThrottle


class ScopedRateThrottle(DRFScopedRateThrottle):
    """Scoped throttle that never applies to authenticated admin users."""

    def allow_request(self, request, view):
        """Skip throttling for authenticated admin users."""
        user = getattr(request, "user", None)
        if user and user.is_authenticated and getattr(user, "role", "") == "ADMIN":
            return True
        return super().allow_request(request, view)
