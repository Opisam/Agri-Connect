"""Tests for the markets module: markets, prices and price history."""

import json
from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.markets.models import Market, MarketPrice


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
def client_admin(admin_user):
    """An API client authenticated as the admin."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


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
def markets(db):
    """Two active markets plus one inactive market."""
    active = Market.objects.create(
        name="Lira Main Market",
        district="Lira",
        location="Adyel",
        description="Main food market",
    )
    second = Market.objects.create(
        name="Kampala Central Market",
        district="Kampala",
        location="Nakasero",
    )
    inactive = Market.objects.create(
        name="Old Market",
        district="Kampala",
        is_active=False,
    )
    return active, second, inactive


@pytest.fixture
def prices(markets):
    """Sample prices across the active markets on distinct dates."""
    active, second, _inactive = markets
    today = timezone.localdate()
    return [
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1400"),
            price_date=today - timedelta(days=10),
            source="KCCA",
        ),
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1500"),
            price_date=today - timedelta(days=5),
        ),
        MarketPrice.objects.create(
            product="Beans",
            market=second,
            price=Decimal("2500"),
            price_date=today,
        ),
    ]


def _to_json(response):
    """Return the parsed JSON body from an API response."""
    return json.loads(response.content)


def _results(response):
    """Return the paginated results from a list endpoint response."""
    return _to_json(response)["data"]["results"]


class TestMarkets:
    """Market CRUD, visibility and admin permissions."""

    def test_five_major_markets_seeded(self, db):
        """The initial five Ugandan markets exist after migration."""
        names = set(Market.objects.values_list("name", flat=True))
        assert {"Kampala", "Lira", "Gulu", "Mbarara", "Jinja"} <= names

    def test_public_can_list_active_markets(self, client, markets, db):
        """Listing markets requires no authentication."""
        response = client.get("/api/v1/markets/")
        assert response.status_code == 200
        names = {row["name"] for row in _results(response)}
        assert "Lira Main Market" in names
        assert "Old Market" not in names

    def test_admin_sees_inactive_markets(self, client_admin, markets, db):
        """Administrators see markets regardless of status."""
        response = client_admin.get("/api/v1/markets/")
        assert response.status_code == 200
        names = {row["name"] for row in _results(response)}
        assert "Old Market" in names

    def test_farmer_cannot_create_market(self, client_farmer, db):
        """A farmer cannot create a market."""
        response = client_farmer.post(
            "/api/v1/markets/",
            {"name": "New Market", "district": "Gulu"},
        )
        assert response.status_code == 403

    def test_buyer_cannot_delete_market(self, client_buyer, markets, db):
        """A buyer cannot delete a market."""
        active, _second, _inactive = markets
        response = client_buyer.delete(f"/api/v1/markets/{active.id}/")
        assert response.status_code == 403

    def test_admin_creates_market(self, client_admin, db):
        """An admin can create a market."""
        response = client_admin.post(
            "/api/v1/markets/",
            {"name": "Arua Market", "district": "Arua", "location": "Oli"},
        )
        assert response.status_code == 201
        assert _to_json(response)["data"]["name"] == "Arua Market"

    def test_admin_updates_market(self, client_admin, markets, db):
        """An admin can update a market."""
        active, _second, _inactive = markets
        response = client_admin.patch(
            f"/api/v1/markets/{active.id}/",
            {"is_active": False},
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["is_active"] is False

    def test_admin_deletes_market(self, client_admin, markets, db):
        """An admin can delete a market and its prices are removed."""
        active, _second, _inactive = markets
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1400"),
            price_date=timezone.localdate(),
        )
        response = client_admin.delete(f"/api/v1/markets/{active.id}/")
        assert response.status_code == 204
        assert not MarketPrice.objects.filter(market=active).exists()


class TestMarketPrices:
    """Market price CRUD, validation and history preservation."""

    def test_only_admin_can_create_price(self, client_farmer, client_buyer, markets, db):
        """Farmers and buyers cannot record prices."""
        active, _second, _inactive = markets
        payload = {
            "product": "Maize",
            "market": active.id,
            "price": "1600",
            "unit": "kg",
            "price_date": "2026-09-01",
        }
        assert client_farmer.post("/api/v1/markets/prices/", payload).status_code == 403
        assert client_buyer.post("/api/v1/markets/prices/", payload).status_code == 403

    def test_admin_creates_price(self, client_admin, markets, db):
        """An admin can record a market price."""
        active, _second, _inactive = markets
        response = client_admin.post(
            "/api/v1/markets/prices/",
            {
                "product": "Maize",
                "market": active.id,
                "price": "1600",
                "unit": "kg",
                "price_date": "2026-09-01",
                "source": "KCCA",
            },
        )
        assert response.status_code == 201
        data = _to_json(response)["data"]
        assert data["market_name"] == "Lira Main Market"

    def test_public_can_list_prices(self, client, prices, db):
        """Prices are publicly browsable."""
        response = client.get("/api/v1/markets/prices/")
        assert response.status_code == 200
        assert len(_results(response)) == 3

    def test_public_can_view_price_detail(self, client, prices, db):
        """A single price row is publicly readable."""
        response = client.get(f"/api/v1/markets/prices/{prices[0].id}/")
        assert response.status_code == 200
        assert _to_json(response)["data"]["product"] == "Maize"

    def test_list_hides_inactive_market_prices(self, client, markets, db):
        """Prices from inactive markets are hidden from the public."""
        _active, _second, _inactive = markets
        MarketPrice.objects.create(
            product="Maize",
            market=_inactive,
            price=Decimal("1200"),
            price_date=timezone.localdate(),
        )
        response = client.get("/api/v1/markets/prices/")
        assert response.status_code == 200
        result_ids = [row["id"] for row in _results(response)]
        assert MarketPrice.objects.get(market=_inactive).id not in result_ids

    def test_admin_sees_inactive_market_prices(self, client_admin, markets, db):
        """Administrators see prices even for inactive markets."""
        _active, second, inactive = markets
        MarketPrice.objects.create(
            product="Maize",
            market=inactive,
            price=Decimal("1200"),
            price_date=timezone.localdate(),
        )
        MarketPrice.objects.create(
            product="Beans",
            market=second,
            price=Decimal("2500"),
            price_date=timezone.localdate(),
        )
        response = client_admin.get("/api/v1/markets/prices/")
        assert response.status_code == 200
        products = {row["product"] for row in _results(response)}
        assert "Maize" in products
        assert "Beans" in products

    def test_price_history_preserved(self, client, prices, db):
        """Adding a newer price does not overwrite older rows."""
        active = prices[0].market
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1600"),
            price_date=timezone.localdate(),
        )
        response = client.get(f"/api/v1/markets/prices/?market={active.id}&product=maize")
        assert response.status_code == 200
        rows = _results(response)
        assert len(rows) == 3
        assert {Decimal(row["price"]) for row in rows} == {
            Decimal("1400"),
            Decimal("1500"),
            Decimal("1600"),
        }

    def test_duplicate_price_same_date_rejected(self, client_admin, markets, db):
        """One price per product, market, unit and day."""
        active, _second, _inactive = markets
        payload = {
            "product": "Maize",
            "market": active.id,
            "price": "1400",
            "unit": "kg",
            "price_date": "2026-09-01",
        }
        assert client_admin.post("/api/v1/markets/prices/", payload).status_code == 201
        response = client_admin.post("/api/v1/markets/prices/", payload)
        assert response.status_code == 400

    def test_price_rejects_non_positive_amount(self, client_admin, markets, db):
        """Prices must be greater than zero."""
        active, _second, _inactive = markets
        response = client_admin.post(
            "/api/v1/markets/prices/",
            {
                "product": "Maize",
                "market": active.id,
                "price": "0",
                "unit": "kg",
                "price_date": "2026-09-01",
            },
        )
        assert response.status_code == 400

    def test_price_date_in_future_rejected(self, client_admin, markets, db):
        """Future price dates are not allowed."""
        active, _second, _inactive = markets
        future = (timezone.localdate() + timedelta(days=2)).isoformat()
        response = client_admin.post(
            "/api/v1/markets/prices/",
            {
                "product": "Maize",
                "market": active.id,
                "price": "1600",
                "unit": "kg",
                "price_date": future,
            },
        )
        assert response.status_code == 400

    def test_non_admin_cannot_update_price(self, client_farmer, prices, db):
        """Only admins can modify prices."""
        response = client_farmer.patch(
            f"/api/v1/markets/prices/{prices[0].id}/",
            {"price": "999"},
        )
        assert response.status_code == 403


class TestPriceHistory:
    """Current-price and history endpoints."""

    def test_current_returns_latest_price_per_product(self, client, prices, db):
        """The current endpoint returns the newest row per product and market."""
        response = client.get("/api/v1/markets/prices/current/")
        assert response.status_code == 200
        rows = _to_json(response)["data"]
        assert len(rows) == 2
        maize = next(r for r in rows if r["product"] == "Maize")
        assert Decimal(maize["price"]) == Decimal("1500")

    def test_history_returns_ascending_order(self, client, markets, db):
        """History is ordered oldest first."""
        active, _second, _inactive = markets
        today = timezone.localdate()
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1400"),
            price_date=today - timedelta(days=10),
        )
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1500"),
            price_date=today - timedelta(days=5),
        )
        MarketPrice.objects.create(
            product="Maize",
            market=active,
            price=Decimal("1600"),
            price_date=today,
        )
        response = client.get(
            f"/api/v1/markets/prices/history/?market={active.id}&product=maize"
        )
        assert response.status_code == 200
        rows = _to_json(response)["data"]
        prices_values = [Decimal(row["price"]) for row in rows]
        assert prices_values == [Decimal("1400"), Decimal("1500"), Decimal("1600")]

    def test_history_filters_by_date_range(self, client, prices, db):
        """History respects date range filters."""
        active = prices[0].market
        today = timezone.localdate()
        start = (today - timedelta(days=8)).isoformat()
        end = (today - timedelta(days=4)).isoformat()
        response = client.get(
            f"/api/v1/markets/prices/history/?market={active.id}"
            f"&product=maize&start_date={start}&end_date={end}"
        )
        assert response.status_code == 200
        rows = _to_json(response)["data"]
        # Only the 1500 price on (today - 5 days) falls inside the range.
        assert [Decimal(row["price"]) for row in rows] == [Decimal("1500")]

    def test_history_ignores_inactive_markets(self, client, markets, db):
        """Prices from inactive markets are excluded from history."""
        _active, _second, inactive = markets
        MarketPrice.objects.create(
            product="Maize",
            market=inactive,
            price=Decimal("1200"),
            price_date=timezone.localdate(),
        )
        response = client.get(
            f"/api/v1/markets/prices/history/?market={inactive.id}&product=maize"
        )
        assert response.status_code == 200
        assert _to_json(response)["data"] == []
