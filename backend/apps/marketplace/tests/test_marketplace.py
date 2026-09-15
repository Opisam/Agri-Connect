"""Tests for the marketplace module: categories, listings and orders."""

import json
from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.marketplace.models import Listing, Order, ProduceCategory


@pytest.fixture
def farmer(db):
    """A verified farmer account."""
    return User.objects.create_user(
        username="farmer1",
        email="farmer1@example.com",
        password="StrongPass1",
        role=User.Roles.FARMER,
        full_name="Okello James",
        phone="+256701234567",
    )


@pytest.fixture
def other_farmer(db):
    """A second farmer used to test ownership isolation."""
    return User.objects.create_user(
        username="farmer2",
        email="farmer2@example.com",
        password="StrongPass1",
        role=User.Roles.FARMER,
        full_name="Auma Rita",
        phone="+256702234567",
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
def categories(db):
    """The seeded produce categories."""
    return list(ProduceCategory.objects.all())


@pytest.fixture
def category(categories):
    """The first produce category."""
    return categories[0]


@pytest.fixture
def listing(farmer, category):
    """An active listing owned by the farmer."""
    return Listing.objects.create(
        farmer=farmer,
        product_name="Maize",
        category=category,
        quantity=Decimal("2500"),
        unit="kg",
        price_per_unit=Decimal("1400"),
        location="Opit, Gulu",
        district="Gulu",
        available_from=timezone.localdate() + timedelta(days=1),
        status=Listing.Statuses.ACTIVE,
    )


def _to_json(response):
    """Return the parsed JSON body from an API response."""
    return json.loads(response.content)


def _results(response):
    """Return the paginated results from a list endpoint response."""
    return _to_json(response)["data"]["results"]


class TestProduceCategories:
    """Produce category endpoints."""

    def test_categories_are_seeded(self, categories):
        """The eight initial categories exist."""
        names = {c.name for c in categories}
        assert {"Cereals", "Legumes", "Fruits", "Vegetables", "Coffee"} <= names
        assert len(categories) == 8

    def test_public_can_list_categories(self, client, db):
        """Listing categories requires no authentication."""
        response = client.get("/api/v1/marketplace/categories/")
        assert response.status_code == 200
        assert len(_results(response)) == 8


class TestListings:
    """Marketplace listing CRUD, search, filter and ordering."""

    def test_farmer_creates_listing(self, client_farmer, farmer, category):
        """Create returns 201 and initialises quantity_remaining."""
        response = client_farmer.post(
            "/api/v1/marketplace/listings/",
            data={
                "product_name": "Beans",
                "category": category.id,
                "quantity": "500.00",
                "unit": "kg",
                "price_per_unit": "3000.00",
                "location": "Lira",
                "district": "Lira",
                "available_from": "2026-09-20",
                "description": "Dried beans",
                "status": "ACTIVE",
            },
            format="json",
        )
        assert response.status_code == 201
        body = _to_json(response)["data"]
        assert body["product_name"] == "Beans"
        assert body["quantity_remaining"] == "500.00"
        assert body["farmer"] == farmer.id

    def test_buyer_cannot_create_listing(self, client_buyer, category):
        """Buyers get 403 when creating listings."""
        response = client_buyer.post(
            "/api/v1/marketplace/listings/",
            data={
                "product_name": "Maize",
                "category": category.id,
                "quantity": "100",
                "price_per_unit": "1400",
                "location": "Gulu",
                "district": "Gulu",
                "status": "ACTIVE",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_public_can_browse_active_listings(self, client, listing):
        """Anonymous users see active listings."""
        response = client.get("/api/v1/marketplace/listings/")
        assert response.status_code == 200
        results = _results(response)
        assert len(results) == 1
        assert results[0]["product_name"] == "Maize"

    def test_buyer_cannot_see_drafts(self, client, farmer, category):
        """Draft listings are hidden from buyers."""
        Listing.objects.create(
            farmer=farmer,
            product_name="Coffee",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("8000"),
            location="Mbale",
            district="Mbale",
            status=Listing.Statuses.DRAFT,
        )
        response = client.get("/api/v1/marketplace/listings/")
        assert response.status_code == 200
        assert len(_results(response)) == 0

    def test_farmer_sees_own_listings_and_active_others(
        self, client_farmer, farmer, other_farmer, category, listing
    ):
        """A farmer can manage drafts while still browsing active listings."""
        Listing.objects.create(
            farmer=farmer,
            product_name="Coffee",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("8000"),
            location="Mbale",
            district="Mbale",
            status=Listing.Statuses.DRAFT,
        )
        Listing.objects.create(
            farmer=other_farmer,
            product_name="Irish Potatoes",
            category=category,
            quantity=Decimal("200"),
            price_per_unit=Decimal("2500"),
            location="Kabale",
            district="Kabale",
            status=Listing.Statuses.DRAFT,
        )
        response = client_farmer.get("/api/v1/marketplace/listings/")
        products = {r["product_name"] for r in _results(response)}
        assert "Coffee" in products
        assert "Maize" in products
        assert "Irish Potatoes" not in products

    def test_search_by_product(self, client, listing):
        """Search matches the product name."""
        response = client.get("/api/v1/marketplace/listings/?search=maize")
        assert len(_results(response)) == 1

    def test_filter_by_district(self, client, farmer, category, listing):
        """District filter narrows results."""
        Listing.objects.create(
            farmer=farmer,
            product_name="Millet",
            category=category,
            quantity=Decimal("300"),
            price_per_unit=Decimal("1500"),
            location="Lira",
            district="Lira",
            status=Listing.Statuses.ACTIVE,
        )
        response = client.get("/api/v1/marketplace/listings/?district=lira")
        results = _results(response)
        assert len(results) == 1
        assert results[0]["district"] == "Lira"

    def test_filter_by_price_range(self, client, farmer, category, listing):
        """min/max price filters restrict results."""
        Listing.objects.create(
            farmer=farmer,
            product_name="Coffee",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("8000"),
            location="Mbale",
            district="Mbale",
            status=Listing.Statuses.ACTIVE,
        )
        response = client.get(
            "/api/v1/marketplace/listings/?min_price=7900&max_price=8100"
        )
        results = _results(response)
        assert len(results) == 1
        assert results[0]["product_name"] == "Coffee"

    def test_ordering_by_price(self, client, farmer, category, listing):
        """Ordering by price_per_unit works."""
        Listing.objects.create(
            farmer=farmer,
            product_name="Rice",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("5000"),
            location="Arua",
            district="Arua",
            status=Listing.Statuses.ACTIVE,
        )
        response = client.get("/api/v1/marketplace/listings/?ordering=price_per_unit")
        prices = [r["price_per_unit"] for r in _results(response)]
        assert prices == sorted(prices)

    def test_farmer_updates_own_listing(self, client_farmer, listing):
        """A farmer can update their own listing."""
        response = client_farmer.patch(
            f"/api/v1/marketplace/listings/{listing.id}/",
            data={"description": "Dried maize grain"},
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["description"] == "Dried maize grain"

    def test_farmer_cannot_edit_quantity(self, client_farmer, listing):
        """Quantity is immutable after creation."""
        response = client_farmer.patch(
            f"/api/v1/marketplace/listings/{listing.id}/",
            data={"quantity": "5000.00"},
            format="json",
        )
        assert response.status_code == 400
        assert "quantity" in _to_json(response)["errors"]

    def test_farmer_cancel_listing(self, client_farmer, listing):
        """A farmer can cancel a listing."""
        response = client_farmer.patch(
            f"/api/v1/marketplace/listings/{listing.id}/",
            data={"status": "CANCELLED"},
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["status"] == "CANCELLED"

    def test_farmer_cannot_update_foreign_listing(self, client_farmer, other_farmer, category):
        """Another farmer's listing returns 404."""
        foreign = Listing.objects.create(
            farmer=other_farmer,
            product_name="Cassava",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("1200"),
            location="Masindi",
            district="Masindi",
            status=Listing.Statuses.ACTIVE,
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/listings/{foreign.id}/",
            data={"description": "hijacked"},
            format="json",
        )
        assert response.status_code == 404

    def test_listing_delete_is_soft(self, client_farmer, listing):
        """DELETE hides the listing from normal queries."""
        response = client_farmer.delete(f"/api/v1/marketplace/listings/{listing.id}/")
        assert response.status_code == 204
        assert Listing.objects.count() == 0
        assert Listing.all_objects.get(pk=listing.id).is_deleted is True

    def test_available_from_must_be_future(self, client_farmer, category):
        """available_from in the past is rejected."""
        response = client_farmer.post(
            "/api/v1/marketplace/listings/",
            data={
                "product_name": "Beans",
                "category": category.id,
                "quantity": "100",
                "price_per_unit": "3000",
                "location": "Lira",
                "district": "Lira",
                "available_from": "2020-01-01",
                "status": "ACTIVE",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "available_from" in _to_json(response)["errors"]

    def test_expire_command_marks_old_listings(self, farmer, category):
        """Listings older than 90 days are expired by the command."""
        old = Listing.objects.create(
            farmer=farmer,
            product_name="Maize",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("1400"),
            location="Gulu",
            district="Gulu",
            available_from=timezone.localdate() - timedelta(days=120),
            status=Listing.Statuses.ACTIVE,
        )
        call_command("expire_listings")
        old.refresh_from_db()
        assert old.status == Listing.Statuses.EXPIRED

    def test_expired_listing_can_be_reactivated(self, client_farmer, farmer, category):
        """Updating available_from reactivates an expired listing."""
        old = Listing.objects.create(
            farmer=farmer,
            product_name="Maize",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("1400"),
            location="Gulu",
            district="Gulu",
            available_from=timezone.localdate() - timedelta(days=120),
            status=Listing.Statuses.EXPIRED,
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/listings/{old.id}/",
            data={
                "available_from": "2026-10-01",
                "status": "ACTIVE",
            },
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["status"] == "ACTIVE"


class TestOrders:
    """Order creation, quantity validation and lifecycle."""

    def test_buyer_creates_order(self, client_buyer, listing):
        """Create returns 201 and calculates total_price."""
        response = client_buyer.post(
            "/api/v1/marketplace/orders/",
            data={
                "listing": listing.id,
                "quantity": "500.00",
                "notes": "Pick up on Friday",
            },
            format="json",
        )
        assert response.status_code == 201
        body = _to_json(response)["data"]
        assert body["total_price"] == "700000.00"
        assert body["status"] == "PENDING"

    def test_order_quantity_cannot_exceed_remaining(self, client_buyer, listing):
        """Quantity beyond quantity_remaining returns 400."""
        response = client_buyer.post(
            "/api/v1/marketplace/orders/",
            data={"listing": listing.id, "quantity": "3000.00"},
            format="json",
        )
        assert response.status_code == 400
        assert "quantity" in _to_json(response)["errors"]

    def test_order_rejects_inactive_listing(self, client_buyer, farmer, category):
        """Orders cannot be placed on a cancelled listing."""
        cancelled = Listing.objects.create(
            farmer=farmer,
            product_name="Maize",
            category=category,
            quantity=Decimal("100"),
            price_per_unit=Decimal("1400"),
            location="Gulu",
            district="Gulu",
            status=Listing.Statuses.CANCELLED,
        )
        response = client_buyer.post(
            "/api/v1/marketplace/orders/",
            data={"listing": cancelled.id, "quantity": "50.00"},
            format="json",
        )
        assert response.status_code == 400

    def test_farmer_cannot_create_order(self, client_farmer, listing):
        """Farmers get 403 when creating orders."""
        response = client_farmer.post(
            "/api/v1/marketplace/orders/",
            data={"listing": listing.id, "quantity": "50.00"},
            format="json",
        )
        assert response.status_code == 403

    def test_buyer_lists_only_own_orders(self, client_buyer, listing):
        """Another buyer's orders are not visible."""
        other_buyer = User.objects.create_user(
            username="buyer2",
            email="buyer2@example.com",
            password="StrongPass1",
            role=User.Roles.BUYER,
            full_name="Buyer Two",
            phone="+256705234567",
        )
        Order.objects.create(
            listing=listing, buyer=other_buyer, quantity=Decimal("100")
        )
        response = client_buyer.get("/api/v1/marketplace/orders/")
        assert response.status_code == 200
        assert len(_results(response)) == 0

    def test_farmer_lists_orders_on_own_listings(self, client_farmer, buyer, listing):
        """A farmer sees orders placed against their listings."""
        Order.objects.create(listing=listing, buyer=buyer, quantity=Decimal("200"))
        response = client_farmer.get("/api/v1/marketplace/orders/")
        assert response.status_code == 200
        assert len(_results(response)) == 1

    def test_farmer_accepts_order_and_deducts_quantity(
        self, client_farmer, buyer, listing
    ):
        """Accepting an order decreases quantity_remaining."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "ACCEPTED"},
            format="json",
        )
        assert response.status_code == 200
        body = _to_json(response)["data"]
        assert body["status"] == "ACCEPTED"
        listing.refresh_from_db()
        assert listing.quantity_remaining == Decimal("2000")

    def test_accepting_last_quantity_marks_listing_sold(
        self, client_farmer, buyer, listing
    ):
        """quantity_remaining reaching zero changes the listing to SOLD."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("2500")
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "ACCEPTED"},
            format="json",
        )
        assert response.status_code == 200
        listing.refresh_from_db()
        assert listing.quantity_remaining == Decimal("0.00")
        assert listing.status == Listing.Statuses.SOLD

    def test_accept_more_than_available_rejected(self, client_farmer, buyer, listing):
        """Overselling across orders is blocked on accept."""
        first = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("2000")
        )
        first.accept()
        second = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("1000")
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{second.id}/",
            data={"status": "ACCEPTED"},
            format="json",
        )
        assert response.status_code == 400

    def test_buyer_cancels_pending_order(self, client_buyer, buyer, listing):
        """Cancelling a pending order leaves quantity_remaining unchanged."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        response = client_buyer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "CANCELLED"},
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["status"] == "CANCELLED"
        listing.refresh_from_db()
        assert listing.quantity_remaining == Decimal("2500")

    def test_buyer_cancelling_accepted_order_restores_quantity(
        self, client_buyer, buyer, listing
    ):
        """Cancelling an accepted order restores the quantity."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        order.accept()
        listing.refresh_from_db()
        assert listing.quantity_remaining == Decimal("2000")
        response = client_buyer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "CANCELLED"},
            format="json",
        )
        assert response.status_code == 200
        listing.refresh_from_db()
        assert listing.quantity_remaining == Decimal("2500")

    def test_farmer_rejects_pending_order(self, client_farmer, buyer, listing):
        """Rejecting a pending order leaves quantity untouched."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "REJECTED", "farmer_notes": "Sold out"},
            format="json",
        )
        assert response.status_code == 200
        body = _to_json(response)["data"]
        assert body["status"] == "REJECTED"
        assert body["farmer_notes"] == "Sold out"
        listing.refresh_from_db()
        assert listing.quantity_remaining == Decimal("2500")

    def test_farmer_completes_accepted_order(self, client_farmer, buyer, listing):
        """Completing an accepted order works."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        order.accept()
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "COMPLETED"},
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["status"] == "COMPLETED"

    def test_buyer_cannot_accept_own_order(self, client_buyer, buyer, listing):
        """Role restrictions prevent buyers from accepting orders."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        response = client_buyer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "ACCEPTED"},
            format="json",
        )
        assert response.status_code == 400
        assert "status" in _to_json(response)["errors"]

    def test_farmer_cannot_cancel_order_as_buyer(
        self, client_farmer, buyer, listing
    ):
        """Role restrictions prevent farmers from cancelling orders."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        response = client_farmer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"status": "CANCELLED"},
            format="json",
        )
        assert response.status_code == 400
        assert "status" in _to_json(response)["errors"]

    def test_order_quantity_cannot_be_changed(self, client_buyer, buyer, listing):
        """Editing quantity after creation is blocked."""
        order = Order.objects.create(
            listing=listing, buyer=buyer, quantity=Decimal("500")
        )
        response = client_buyer.patch(
            f"/api/v1/marketplace/orders/{order.id}/",
            data={"quantity": "100.00"},
            format="json",
        )
        assert response.status_code == 400
        assert "quantity" in _to_json(response)["errors"]
