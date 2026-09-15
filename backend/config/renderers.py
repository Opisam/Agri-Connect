"""Custom DRF renderer that wraps responses in the AgriConnect standard envelope.

Success responses:
    {"status": "success", "data": {...}}
    {"status": "success", "data": [...], "pagination": {...}}
"""

from rest_framework.renderers import JSONRenderer


class ApiRenderer(JSONRenderer):
    """Wraps all successful responses in the standard {status, data} envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """Wrap successful responses in the standard AgriConnect envelope."""
        # Skip wrapping for error responses handled by the exception handler.
        response = renderer_context.get("response") if renderer_context else None
        if response is not None and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)

        envelope = {"status": "success", "data": data}
        return super().render(envelope, accepted_media_type, renderer_context)
