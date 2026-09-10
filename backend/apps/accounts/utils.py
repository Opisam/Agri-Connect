"""Utilities for the accounts app."""

import re

UGANDA_PHONE_RE = re.compile(r"^\+?256\d{9}$")


def validate_ugandan_phone(value: str) -> str:
    """Normalize a Ugandan phone number to +256XXXXXXXXX format."""
    if not value:
        raise ValueError("Phone number is required.")
    cleaned = value.strip().replace(" ", "")
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
    elif cleaned.startswith("0"):
        cleaned = "+256" + cleaned[1:]
    if not UGANDA_PHONE_RE.match(cleaned):
        raise ValueError("Invalid Ugandan phone number. Use +256XXXXXXXXX format.")
    return cleaned
