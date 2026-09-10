"""Smoke tests for the AgriConnect project."""

from django.urls import resolve, reverse


def test_admin_url_resolves():
    match = resolve("/admin/")
    assert match.url_name == "index"


def test_admin_login_reverses():
    assert reverse("admin:index") == "/admin/"
