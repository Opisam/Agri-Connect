"""Tests for login, JWT refresh, and logout flows."""

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User

pytestmark = pytest.mark.django_db

VALID_FARMER = {
    "full_name": "Auma Rita",
    "phone": "0772111222",
    "email": "auma@example.com",
    "password": "StrongPass1",
    "role": "FARMER",
}


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def farmer():
    return User.objects.create_user(
        username="auma.rita",
        full_name="Auma Rita",
        phone="0772111222",
        email="auma@example.com",
        password="StrongPass1",
        role=User.Roles.FARMER,
    )


class TestLogin:
    def test_login_with_email(self, client, farmer):
        resp = client.post(
            "/api/v1/auth/login/",
            {"identifier": "auma@example.com", "password": "StrongPass1"},
            format="json",
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"
        assert body["data"]["user"]["role"] == "FARMER"
        assert body["data"]["access"]
        assert body["data"]["refresh"]

    def test_login_with_username(self, client, farmer):
        resp = client.post(
            "/api/v1/auth/login/",
            {"identifier": "auma.rita", "password": "StrongPass1"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["refresh"]

    def test_login_wrong_password(self, client, farmer):
        resp = client.post(
            "/api/v1/auth/login/",
            {"identifier": "auma@example.com", "password": "WrongPass1"},
            format="json",
        )
        assert resp.status_code == 401
        assert resp.json()["status"] == "error"

    def test_login_unknown_email(self, client):
        resp = client.post(
            "/api/v1/auth/login/",
            {"identifier": "ghost@example.com", "password": "WrongPass1"},
            format="json",
        )
        assert resp.status_code == 401

    def test_login_locks_account_after_five_failures(self, client, farmer):
        for _ in range(5):
            client.post(
                "/api/v1/auth/login/",
                {"identifier": "auma@example.com", "password": "WrongPass1"},
                format="json",
            )
        farmer.refresh_from_db()
        assert farmer.is_locked

        resp = client.post(
            "/api/v1/auth/login/",
            {"identifier": "auma@example.com", "password": "StrongPass1"},
            format="json",
        )
        assert resp.status_code == 400
        assert "locked" in resp.json()["message"].lower()

    def test_successful_login_resets_failed_attempts(self, client, farmer):
        for _ in range(3):
            client.post(
                "/api/v1/auth/login/",
                {"identifier": "auma@example.com", "password": "WrongPass1"},
                format="json",
            )
        assert client.post(
            "/api/v1/auth/login/",
            {"identifier": "auma@example.com", "password": "StrongPass1"},
            format="json",
        ).status_code == 200
        farmer.refresh_from_db()
        assert farmer.failed_login_attempts == 0
        assert not farmer.is_locked


class TestTokenRefresh:
    def test_refresh_returns_new_access(self, client, farmer):
        refresh = RefreshToken.for_user(farmer)
        client.force_authenticate(farmer)
        resp = client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": str(refresh)},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["access"]

    def test_refresh_invalid_token(self, client):
        client.force_authenticate(None)
        resp = client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": "not-a-token"},
            format="json",
        )
        assert resp.status_code in (400, 401)


class TestLogout:
    def test_logout_blacklists_refresh_token(self, client, farmer):
        refresh = RefreshToken.for_user(farmer)
        client.force_authenticate(farmer)

        resp = client.post(
            "/api/v1/auth/logout/",
            {"refresh": str(refresh)},
            format="json",
        )
        assert resp.status_code == 200

        # The blacklisted refresh token can no longer be used.
        client.force_authenticate(None)
        resp = client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": str(refresh)},
            format="json",
        )
        assert resp.status_code in (400, 401)

    def test_logout_requires_auth(self, client):
        resp = client.post("/api/v1/auth/logout/", {"refresh": "somerefresh"}, format="json")
        assert resp.status_code in (401, 403)
