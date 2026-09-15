"""Consistent API exception handling for AgriConnect."""

from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """Convert DRF exceptions into the standard {status, message, errors} format."""
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception (e.g. 500). React with a generic message.
        return response

    detail = response.data

    if isinstance(detail, dict) and "detail" in detail:
        payload = {"status": "error", "message": str(detail["detail"])}
    elif isinstance(detail, dict):
        payload = {
            "status": "error",
            "message": _first_error(detail),
            "errors": _error_details(detail),
        }
    elif isinstance(detail, list):
        payload = {
            "status": "error",
            "message": "; ".join(str(item) for item in detail),
            "errors": detail,
        }
    else:
        payload = {"status": "error", "message": str(detail)}

    response.data = payload
    return response


def _first_error(detail: dict) -> str:
    """Extract a human readable message from the first field error."""
    for _field, errors in detail.items():
        if errors:
            if isinstance(errors, list):
                first = errors[0]
                message = getattr(first, "message", None) or str(first)
                return message
            if hasattr(errors, "message"):
                return errors.message
            return str(errors)
    return "Validation failed."


def _error_details(detail: dict) -> dict:
    """Keep the raw per-field errors so clients can highlight fields."""
    out = {}
    for field, errors in detail.items():
        if isinstance(errors, list):
            out[field] = [getattr(e, "message", None) or str(e) for e in errors]
        else:
            out[field] = getattr(errors, "message", None) or str(errors)
    return out
