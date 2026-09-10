"""Tests for the /me/ profile endpoint and role-based permissions."""

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def make_user(**kwargs):
    defaults = {
        "username": "user.x",
        "full_name": "Kwame Otim",
        "phone": "0772333444",
        "email": "kwame@example.com",
        "password": "StrongPass1",
    }
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


class TestMeEndpoint:
    def test_me_returns_profile(self, client):
        user = make_user(role=User.Roles.BUYER)
        client.force_authenticate(user)
        resp = client.get("/api/v1/auth/me/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "success"
        assert body["data"]["email"] == "kwame@example.com"
        assert body["data"]["role"] == "BUYER"
        assert "password" not in body["data"]

    def test_me_requires_auth(self, client):
        assert client.get("/api/v1/auth/me/").status_code in (401, 403)

    def test_me_update_profile(self, client):
        user = make_user(role=User.Roles.FARMER)
        client.force_authenticate(user)
        resp = client.patch(
            "/api/v1/auth/me/",
            {"full_name": "Kwame Othieno", "location": "Soroti", "district": "Soroti"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["full_name"] == "Kwame Othieno"
        user.refresh_from_db()
        assert user.location == "Soroti"

    def test_me_update_password(self, client):
        user = make_user(role=User.Roles.FARMER)
        client.force_authenticate(user)
        resp = client.patch("/api/v1/auth/me/", {"password": "NewPass123"}, format="json")
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.check_password("NewPass123")

    def test_me_cannot_change_role(self, client):
        user = make_user(role=User.Roles.BUYER)
        client.force_authenticate(user)
        resp = client.patch("/api/v1/auth/me/", {"role": "FARMER"}, format="json")
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.role == User.Roles.BUYER

    def test_me_update_rejects_duplicate_email(self, client):
        make_user(username="first.x", email="kwame@example.com", phone="0772666777")
        other = make_user(username="other.x", email="other@example.com", phone="0772555666")
        client.force_authenticate(other)
        resp = client.patch(
            "/api/v1/auth/me/",
            {"email": "kwame@example.com"},
            format="json",
        )
        assert resp.status_code == 400
        assert "email" in resp.json()["errors"]


class TestRolePermissions:
    def test_user_cannot_restrict_by_location(self, client):
        user = make_user(role=User.Roles.BUYER)
        client.force_authenticate(user)
        assert user.is_farmer is False
        assert user.is_buyer is True

    def test_admin_can_access(self, client):
        admin = make_user(
            username="admin.x",
            role=User.Roles.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        admin.set_password("AdminPass1")
        admin.save()
        client.force_authenticate(admin)
        resp = client.get("/api/v1/auth/me/")
        assert resp.status_code == 200
        assert resp.json()["data"]["role"] == "ADMIN"
