"""Tests for the notifications module: order events, read state and isolation."""

import json
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.marketplace.models import Listing, Order, ProduceCategory
from apps.notifications.models import Notification


@pytest.fixture
def admin_user(db):
    """An administrator account."""
    return User.objects.create_user(
        username="admin1",
        email="admin1@example.com",
        password="StrongPass1",
        role=User.Roles.ADMIN,
        full_name="Admin One",
        phone="+256709234567",
    )


@pytest.fixture
def farmer(db):
    """A farmer account."""
    return User.objects.create_user(
        username="farmer1",
        email="farmer1@example.com",
        password="StrongPass1",
        role=User.Roles.FARMER,
        full_name="Okello James",
        phone="+256701234567",
    )


@pytest.fixture
def buyer(db):
    """A buyer account."""
    return User.objects.create_user(
        username="buyer1",
        email="buyer1@example.com",
        password="StrongPass1",
        role=User.Roles.BUYER,
        full_name="Buyer Sam",
        phone="+256703234567",
    )


@pytest.fixture
def client_farmer(farmer):
    """An API client authenticated as the farmer."""
    client = APIClient()
    client.force_authenticate(user=farmer)
    return client


@pytest.fixture
def client_buyer(buyer):
    """An API client authenticated as the buyer."""
    client = APIClient()
    client.force_authenticate(user=buyer)
    return client


@pytest.fixture
def produce_category(db):
    """A produce category for listings."""
    return ProduceCategory.objects.create(name="Test Cereals", slug="test-cereals")


@pytest.fixture
def listing(farmer, produce_category):
    """An active listing owned by the farmer."""
    return Listing.objects.create(
        farmer=farmer,
        product_name="Maize",
        category=produce_category,
        quantity=Decimal("100"),
        unit="kg",
        price_per_unit=Decimal("1500"),
        location="Adyel",
        district="Lira",
        status=Listing.Statuses.ACTIVE,
    )


@pytest.fixture
def order(buyer, listing):
    """A pending order placed by the buyer on the listing."""
    return Order.objects.create(
        listing=listing,
        buyer=buyer,
        quantity=Decimal("10"),
        notes="Deliver to Adyel.",
    )


def _to_json(response):
    """Return the parsed JSON body from an API response."""
    return json.loads(response.content)


def _results(response):
    """Return the paginated results from a list endpoint response."""
    return _to_json(response)["data"]["results"]


class TestOrderEventNotifications:
    """Order events create the right notifications for the right users."""

    def test_creating_order_notifies_farmer(self, client_buyer, listing, order, db):
        """Placing an order delivers an ORDER_RECEIVED notification to the farmer."""
        response = client_buyer.post(
            "/api/v1/marketplace/orders/",
            {"listing": listing.id, "quantity": "10"},
        )
        assert response.status_code == 201
        notification = Notification.objects.get(
            user=listing.farmer, notification_type=Notification.Types.ORDER_RECEIVED
        )
        assert notification.title == "New order received"
        assert notification.related_object_type == "order"
        assert notification.related_object_id == _to_json(response)["data"]["id"]
        assert notification.is_read is False

    def test_accepting_order_notifies_buyer(self, client_farmer, order, db):
        """Accepting an order delivers an ORDER_ACCEPTED notification to the buyer."""
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            {"status": "ACCEPTED"},
        )
        assert response.status_code == 200
        notification = Notification.objects.get(
            user=order.buyer, notification_type=Notification.Types.ORDER_ACCEPTED
        )
        assert notification.title == "Order accepted"

    def test_rejecting_order_notifies_buyer(self, client_farmer, order, db):
        """Rejecting an order delivers an ORDER_REJECTED notification to the buyer."""
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            {"status": "REJECTED"},
        )
        assert response.status_code == 200
        assert Notification.objects.filter(
            user=order.buyer, notification_type=Notification.Types.ORDER_REJECTED
        ).exists()

    def test_completing_order_notifies_buyer(self, client_farmer, order, db):
        """Completing a delivered order notifies the buyer."""
        order.status = Order.Statuses.ACCEPTED
        order.save(update_fields=["status"])
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            {"status": "COMPLETED"},
        )
        assert response.status_code == 200
        assert Notification.objects.filter(
            user=order.buyer, notification_type=Notification.Types.ORDER_COMPLETED
        ).exists()


class TestNotificationEndpoints:
    """Notification list, unread count and read-state endpoints."""

    def test_user_sees_only_own_notifications(self, client_farmer, client_buyer, order, db):
        """Each user only sees their own notifications."""
        client_buyer.post(
            "/api/v1/marketplace/orders/",
            {"listing": order.listing.id, "quantity": "5"},
        )
        farmer_page = _results(
            client_farmer.get("/api/v1/notifications/")
        )
        buyer_page = _results(
            client_buyer.get("/api/v1/notifications/")
        )
        assert len(farmer_page) >= 1
        assert all(row["user"] == order.listing.farmer.id for row in farmer_page)
        assert len(buyer_page) == 0

    def test_unread_count_endpoint(self, client_farmer, client_buyer, order, db):
        """The unread endpoint reports the unread count for the user."""
        client_buyer.post(
            "/api/v1/marketplace/orders/",
            {"listing": order.listing.id, "quantity": "5"},
        )
        data = _to_json(client_farmer.get("/api/v1/notifications/unread/"))["data"]
        assert data["count"] >= 1

    def test_mark_single_as_read(self, client_farmer, order, db):
        """Patching is_read marks the notification as read."""
        notification = Notification.objects.create(
            user=order.listing.farmer,
            notification_type=Notification.Types.ORDER_RECEIVED,
            title="New order received",
            message="Test message",
            related_object_type="order",
            related_object_id=order.id,
        )
        response = client_farmer.patch(
            f"/api/v1/notifications/{notification.id}/",
            {"is_read": True},
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["is_read"] is True
        notification.refresh_from_db()
        assert notification.is_read is True
        data = _to_json(client_farmer.get("/api/v1/notifications/unread/"))["data"]
        assert data["count"] == 0

    def test_cannot_mark_others_notification(self, client_buyer, order, db):
        """A user cannot read another user's notification."""
        notification = Notification.objects.create(
            user=order.listing.farmer,
            notification_type=Notification.Types.ORDER_RECEIVED,
            title="New order received",
            message="Test message",
            related_object_type="order",
            related_object_id=order.id,
        )
        response = client_buyer.patch(
            f"/api/v1/notifications/{notification.id}/",
            {"is_read": True},
        )
        assert response.status_code == 404

    def test_unauthenticated_cannot_list(self, client, db):
        """Listing notifications requires authentication."""
        assert client.get("/api/v1/notifications/").status_code == 401

    def test_mark_all_read(self, client_farmer, order, db):
        """Mark-all-read clears every unread notification."""
        Notification.objects.create(
            user=order.listing.farmer,
            notification_type=Notification.Types.ORDER_RECEIVED,
            title="One",
            message="m1",
        )
        Notification.objects.create(
            user=order.listing.farmer,
            notification_type=Notification.Types.ORDER_COMPLETED,
            title="Two",
            message="m2",
        )
        response = client_farmer.post("/api/v1/notifications/mark-all-read/")
        assert response.status_code == 200
        assert _to_json(response)["data"]["marked"] == 2
        assert (
            Notification.objects.filter(user=order.listing.farmer, is_read=False).count()
            == 0
        )

    def test_filter_by_read_state(self, client_farmer, order, db):
        """Notifications can be filtered by is_read."""
        Notification.objects.create(
            user=order.listing.farmer,
            notification_type=Notification.Types.ORDER_RECEIVED,
            title="Read one",
            message="m1",
            is_read=True,
        )
        Notification.objects.create(
            user=order.listing.farmer,
            notification_type=Notification.Types.ORDER_COMPLETED,
            title="Unread one",
            message="m2",
        )
        unread = _results(client_farmer.get("/api/v1/notifications/", {"is_read": "false"}))
        assert [row["title"] for row in unread] == ["Unread one"]
