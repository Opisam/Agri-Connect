"""Tests for user account creation."""

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User

pytestmark = pytest.mark.django_db


VALID_FARMER = {
    "full_name": "Okello James",
    "phone": "0772123456",
    "email": "okello@example.com",
    "password": "StrongPass1",
    "role": "FARMER",
    "location": "Lira City",
    "district": "Lira",
}


class TestRegistration:
    def test_register_farmer_success(self):
        client = APIClient()
        resp = client.post("/api/v1/auth/register/", VALID_FARMER, format="json")
        assert resp.status_code == 201
        body = resp.json()
        assert body["status"] == "success"
        assert body["data"]["user"]["role"] == "FARMER"
        assert body["data"]["user"]["phone"].startswith("+256")
        assert body["data"]["access"]
        assert body["data"]["refresh"]
        assert User.objects.filter(email="okello@example.com").exists()

    def test_phone_normalized_to_international(self):
        client = APIClient()
        payload = {**VALID_FARMER, "phone": "0772123456"}
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        assert resp.status_code == 201
        user = User.objects.get(email="okello@example.com")
        assert user.phone == "+256772123456"

    def test_register_rejects_invalid_phone(self):
        client = APIClient()
        payload = {**VALID_FARMER, "phone": "12345"}
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        assert resp.status_code == 400
        assert "phone" in resp.json()["errors"]

    def test_register_rejects_weak_password(self):
        client = APIClient()
        payload = {**VALID_FARMER, "password": "short"}
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        assert resp.status_code == 400
        assert "password" in resp.json()["errors"]

    def test_register_rejects_admin_role(self):
        client = APIClient()
        payload = {**VALID_FARMER, "role": "ADMIN"}
        resp = client.post("/api/v1/auth/register/", payload, format="json")
        assert resp.status_code == 400
        assert "role" in resp.json()["errors"]

    def test_register_duplicate_email_rejected(self):
        client = APIClient()
        assert client.post("/api/v1/auth/register/", VALID_FARMER, format="json").status_code == 201
        resp = client.post(
            "/api/v1/auth/register/",
            {**VALID_FARMER, "phone": "0773123456"},
            format="json",
        )
        assert resp.status_code == 400
        assert "email" in resp.json()["errors"]
