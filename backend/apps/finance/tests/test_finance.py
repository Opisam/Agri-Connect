"""Tests for the finance module: expenses, harvests, sales, profit/loss."""

import json
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.farms.models import Crop, Farm, Field
from apps.finance.models import Expense, Harvest, Sale


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
    """A second farmer who should not see the first farmer's data."""
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
    """A buyer who cannot create finance records."""
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
def farm(farmer):
    """A farm owned by the farmer."""
    return Farm.objects.create(
        owner=farmer,
        name="Okello Family Farm",
        location="Opit, Gulu",
        district="Gulu",
        subcounty="Paicho",
        size=Decimal("10.00"),
        size_unit="acres",
        farm_type="crop_farming",
    )


@pytest.fixture
def field(farm):
    """A field inside the farm."""
    return Field.objects.create(
        farm=farm,
        name="Field A",
        size=Decimal("4.00"),
        size_unit="acres",
    )


@pytest.fixture
def crop(farm, field):
    """A crop planted in the field."""
    return Crop.objects.create(
        farm=farm,
        field=field,
        crop_type="maize",
        variety="Longe 5",
        status="PLANTED",
    )


def _to_json(response):
    """Return the parsed JSON body from an API response."""
    return json.loads(response.content)


def _results(response):
    """Return the paginated results from a list endpoint response."""
    return _to_json(response)["data"]["results"]


class TestExpenses:
    """Expense CRUD behaviour."""

    def test_farmer_creates_expense(self, client_farmer, farm):
        """Create returns 201 and binds to the farm."""
        response = client_farmer.post(
            "/api/v1/finance/expenses/",
            data={
                "farm": farm.id,
                "category": "Seeds",
                "amount": "50000.00",
                "date": "2026-09-15",
                "description": "Maize seeds",
            },
            format="json",
        )
        assert response.status_code == 201
        body = _to_json(response)["data"]
        assert body["category"] == "Seeds"
        assert body["amount"] == "50000.00"
        assert body["farm"] == farm.id

    def test_farmer_creates_expense_with_crop(self, client_farmer, farm, crop):
        """Create with optional crop field."""
        response = client_farmer.post(
            "/api/v1/finance/expenses/",
            data={
                "farm": farm.id,
                "crop": crop.id,
                "category": "Fertilizer",
                "amount": "30000.00",
                "date": "2026-09-15",
                "description": "NPK fertilizer",
            },
            format="json",
        )
        assert response.status_code == 201
        assert _to_json(response)["data"]["crop"] == crop.id

    def test_farmer_cannot_create_expense_for_foreign_farm(self, client_farmer, other_farmer):
        """Expenses on another farmer's farm return 400."""
        foreign = Farm.objects.create(
            owner=other_farmer,
            name="Foreign",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        response = client_farmer.post(
            "/api/v1/finance/expenses/",
            data={
                "farm": foreign.id,
                "category": "Seeds",
                "amount": "10000.00",
                "date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "farm" in _to_json(response)["errors"]

    def test_buyer_cannot_create_expense(self, buyer, farm):
        """Buyers get 403 when creating expenses."""
        client = APIClient()
        client.force_authenticate(user=buyer)
        response = client.post(
            "/api/v1/finance/expenses/",
            data={
                "farm": farm.id,
                "category": "Seeds",
                "amount": "10000.00",
                "date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_farmer_lists_only_own_expenses(self, client_farmer, farm, other_farmer):
        """Another farmer's expenses are not visible."""
        other_farm = Farm.objects.create(
            owner=other_farmer,
            name="Other",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        Expense.objects.create(
            farm=other_farm, category="Seeds", amount=Decimal("1000"), date="2026-09-01"
        )
        Expense.objects.create(
            farm=farm, category="Labour", amount=Decimal("2000"), date="2026-09-02"
        )
        response = client_farmer.get("/api/v1/finance/expenses/")
        assert response.status_code == 200
        assert len(_results(response)) == 1
        assert _results(response)[0]["category"] == "Labour"

    def test_farmer_updates_own_expense(self, client_farmer, farm):
        """PATCH updates the expense."""
        expense = Expense.objects.create(
            farm=farm, category="Seeds", amount=Decimal("5000"), date="2026-09-01"
        )
        response = client_farmer.patch(
            f"/api/v1/finance/expenses/{expense.id}/",
            data={"amount": "7500.00"},
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["amount"] == "7500.00"

    def test_expense_delete_is_soft(self, client_farmer, farm):
        """DELETE hides the expense from normal queries."""
        expense = Expense.objects.create(
            farm=farm, category="Seeds", amount=Decimal("5000"), date="2026-09-01"
        )
        response = client_farmer.delete(f"/api/v1/finance/expenses/{expense.id}/")
        assert response.status_code == 204
        assert Expense.objects.count() == 0
        assert Expense.all_objects.get(pk=expense.id).is_deleted is True

    def test_expense_rejects_non_positive_amount(self, client_farmer, farm):
        """Amount must be greater than zero."""
        response = client_farmer.post(
            "/api/v1/finance/expenses/",
            data={
                "farm": farm.id,
                "category": "Seeds",
                "amount": "0",
                "date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "amount" in _to_json(response)["errors"]

    def test_crop_not_belonging_to_farm_rejected(self, client_farmer, farm, other_farmer):
        """Crop from a different farm is rejected."""
        other_farm = Farm.objects.create(
            owner=other_farmer,
            name="Other",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        other_field = Field.objects.create(
            farm=other_farm, name="OF", size=Decimal("2"), size_unit="acres"
        )
        other_crop = Crop.objects.create(
            farm=other_farm, field=other_field, crop_type="beans"
        )
        response = client_farmer.post(
            "/api/v1/finance/expenses/",
            data={
                "farm": farm.id,
                "crop": other_crop.id,
                "category": "Seeds",
                "amount": "5000",
                "date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 400


class TestHarvests:
    """Harvest CRUD behaviour."""

    def test_farmer_creates_harvest(self, client_farmer, farm, crop):
        """Create returns 201 and binds to the farm and crop."""
        response = client_farmer.post(
            "/api/v1/finance/harvests/",
            data={
                "farm": farm.id,
                "crop": crop.id,
                "quantity": "2500.00",
                "unit": "kg",
                "harvest_date": "2026-09-15",
                "notes": "Good yield",
            },
            format="json",
        )
        assert response.status_code == 201
        body = _to_json(response)["data"]
        assert body["quantity"] == "2500.00"
        assert body["unit"] == "kg"
        assert body["crop_name"] == "Maize"

    def test_buyer_cannot_create_harvest(self, buyer, farm, crop):
        """Buyers get 403 when creating harvests."""
        client = APIClient()
        client.force_authenticate(user=buyer)
        response = client.post(
            "/api/v1/finance/harvests/",
            data={
                "farm": farm.id,
                "crop": crop.id,
                "quantity": "1000",
                "harvest_date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_farmer_lists_only_own_harvests(self, client_farmer, farm, crop, other_farmer):
        """Another farmer's harvests are not visible."""
        other_farm = Farm.objects.create(
            owner=other_farmer,
            name="Other",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        other_field = Field.objects.create(
            farm=other_farm, name="OF", size=Decimal("2"), size_unit="acres"
        )
        other_crop = Crop.objects.create(
            farm=other_farm, field=other_field, crop_type="beans"
        )
        Harvest.objects.create(
            farm=other_farm, crop=other_crop, quantity=Decimal("100"), harvest_date="2026-09-01"
        )
        Harvest.objects.create(
            farm=farm, crop=crop, quantity=Decimal("200"), harvest_date="2026-09-02"
        )
        response = client_farmer.get("/api/v1/finance/harvests/")
        assert response.status_code == 200
        assert len(_results(response)) == 1
        assert _results(response)[0]["quantity"] == "200.00"

    def test_harvest_delete_is_soft(self, client_farmer, farm, crop):
        """DELETE hides the harvest from normal queries."""
        harvest = Harvest.objects.create(
            farm=farm, crop=crop, quantity=Decimal("100"), harvest_date="2026-09-01"
        )
        response = client_farmer.delete(f"/api/v1/finance/harvests/{harvest.id}/")
        assert response.status_code == 204
        assert Harvest.objects.count() == 0
        assert Harvest.all_objects.get(pk=harvest.id).is_deleted is True

    def test_harvest_rejects_non_positive_quantity(self, client_farmer, farm, crop):
        """Quantity must be greater than zero."""
        response = client_farmer.post(
            "/api/v1/finance/harvests/",
            data={
                "farm": farm.id,
                "crop": crop.id,
                "quantity": "0",
                "harvest_date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "quantity" in _to_json(response)["errors"]


class TestSales:
    """Sale CRUD behaviour with auto-calculated total."""

    def test_farmer_creates_sale(self, client_farmer, farm, crop):
        """Create returns 201 and auto-calculates total_amount."""
        response = client_farmer.post(
            "/api/v1/finance/sales/",
            data={
                "farm": farm.id,
                "crop": crop.id,
                "quantity": "500.00",
                "unit": "kg",
                "unit_price": "1400.00",
                "buyer_name": "Market Vendor",
                "buyer_contact": "+256704123456",
                "sale_date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 201
        body = _to_json(response)["data"]
        assert body["total_amount"] == "700000.00"
        assert body["quantity"] == "500.00"
        assert body["unit_price"] == "1400.00"

    def test_sale_total_auto_calculated_on_update(self, client_farmer, farmer, farm, crop):
        """PATCH with changed quantity recalculates total."""
        sale = Sale.objects.create(
            farmer=farmer,
            farm=farm,
            crop=crop,
            quantity=Decimal("100"),
            unit_price=Decimal("1400"),
            sale_date="2026-09-15",
        )
        assert sale.total_amount == Decimal("140000.00")
        response = client_farmer.patch(
            f"/api/v1/finance/sales/{sale.id}/",
            data={"quantity": "200.00"},
            format="json",
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["total_amount"] == "280000.00"

    def test_buyer_cannot_create_sale(self, buyer, farm):
        """Buyers get 403 when creating sales."""
        client = APIClient()
        client.force_authenticate(user=buyer)
        response = client.post(
            "/api/v1/finance/sales/",
            data={
                "farm": farm.id,
                "quantity": "100",
                "unit_price": "1400",
                "sale_date": "2026-09-15",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_farmer_lists_only_own_sales(self, client_farmer, farmer, farm, other_farmer):
        """Another farmer's sales are not visible."""
        other_farm = Farm.objects.create(
            owner=other_farmer,
            name="Other",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        Sale.objects.create(
            farmer=other_farmer,
            farm=other_farm,
            quantity=Decimal("100"),
            unit_price=Decimal("1000"),
            sale_date="2026-09-01",
        )
        Sale.objects.create(
            farmer=farmer,
            farm=farm,
            quantity=Decimal("200"),
            unit_price=Decimal("1400"),
            sale_date="2026-09-02",
        )
        response = client_farmer.get("/api/v1/finance/sales/")
        assert response.status_code == 200
        assert len(_results(response)) == 1
        assert _results(response)[0]["total_amount"] == "280000.00"

    def test_sale_delete_is_soft(self, client_farmer, farmer, farm):
        """DELETE hides the sale from normal queries."""
        sale = Sale.objects.create(
            farmer=farmer,
            farm=farm,
            quantity=Decimal("100"),
            unit_price=Decimal("1400"),
            sale_date="2026-09-01",
        )
        response = client_farmer.delete(f"/api/v1/finance/sales/{sale.id}/")
        assert response.status_code == 204
        assert Sale.objects.count() == 0
        assert Sale.all_objects.get(pk=sale.id).is_deleted is True


class TestProfitLoss:
    """Profit/loss calculation endpoint."""

    def test_profit_loss_basic(self, client_farmer, farmer, farm, crop):
        """Expenses and sales produce correct totals."""
        Expense.objects.create(
            farm=farm, category="Seeds", amount=Decimal("2000000"), date="2026-09-01"
        )
        Sale.objects.create(
            farmer=farmer,
            farm=farm,
            crop=crop,
            quantity=Decimal("2500"),
            unit_price=Decimal("1400"),
            sale_date="2026-09-15",
        )
        response = client_farmer.get("/api/v1/finance/profit-loss/")
        assert response.status_code == 200
        data = _to_json(response)["data"]
        assert Decimal(data["total_expenses"]) == Decimal("2000000")
        assert Decimal(data["total_revenue"]) == Decimal("3500000")
        assert Decimal(data["profit_loss"]) == Decimal("1500000")
        assert data["expense_count"] == 1
        assert data["sale_count"] == 1

    def test_profit_loss_filter_by_farm(self, client_farmer, farmer, farm, other_farmer):
        """Filtering by farm_id returns only that farm's data."""
        other_farm = Farm.objects.create(
            owner=farmer,
            name="Second Farm",
            location="Lira",
            district="Lira",
            size=Decimal("5"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        Expense.objects.create(
            farm=farm, category="Seeds", amount=Decimal("500000"), date="2026-09-01"
        )
        Expense.objects.create(
            farm=other_farm, category="Labour", amount=Decimal("300000"), date="2026-09-01"
        )
        response = client_farmer.get(
            f"/api/v1/finance/profit-loss/?farm_id={farm.id}"
        )
        assert response.status_code == 200
        data = _to_json(response)["data"]
        assert Decimal(data["total_expenses"]) == Decimal("500000")
        assert data["expense_count"] == 1

    def test_profit_loss_filter_by_date_range(self, client_farmer, farm):
        """Date range filters expenses and sales correctly."""
        Expense.objects.create(
            farm=farm, category="Seeds", amount=Decimal("100000"), date="2026-08-01"
        )
        Expense.objects.create(
            farm=farm, category="Labour", amount=Decimal("200000"), date="2026-09-15"
        )
        response = client_farmer.get(
            "/api/v1/finance/profit-loss/?start_date=2026-09-01&end_date=2026-09-30"
        )
        assert response.status_code == 200
        data = _to_json(response)["data"]
        assert Decimal(data["total_expenses"]) == Decimal("200000")
        assert data["expense_count"] == 1

    def test_profit_loss_no_data_returns_zero(self, client_farmer):
        """No expenses or sales returns zero totals."""
        response = client_farmer.get("/api/v1/finance/profit-loss/")
        assert response.status_code == 200
        data = _to_json(response)["data"]
        assert Decimal(data["total_expenses"]) == Decimal("0")
        assert Decimal(data["total_revenue"]) == Decimal("0")
        assert Decimal(data["profit_loss"]) == Decimal("0")
