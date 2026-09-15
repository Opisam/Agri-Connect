"""Tests for the farms module: CRUD, ownership, soft deletes and validation."""

import json
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.farms.models import Crop, CropActivity, Farm, Field


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
    """A second farmer who should not see the first farmer's farms."""
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
    """A buyer who cannot create farm resources."""
    return User.objects.create_user(
        username="buyer1",
        email="buyer1@example.com",
        password="StrongPass1",
        role=User.Roles.BUYER,
        full_name="Buyer Sam",
        phone="+256703234567",
    )


@pytest.fixture
def admin(db):
    """An administrator who can view and restore soft-deleted records."""
    return User.objects.create_user(
        username="admin1",
        email="admin@example.com",
        password="StrongPass1",
        role=User.Roles.ADMIN,
        full_name="Admin User",
        phone="+256704234567",
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


FARM_PAYLOAD = {
    "name": "Auma Farm",
    "location": "Bar, Lira",
    "district": "Lira",
    "subcounty": "Bar Sub",
    "size": "5.50",
    "size_unit": "hectares",
    "farm_type": "mixed_farming",
    "description": "Mixed crops and livestock",
}


def _to_json(response):
    """Return the parsed JSON body from an API response."""
    return json.loads(response.content)


def _results(response):
    """Return the paginated results from a list endpoint response."""
    return _to_json(response)["data"]["results"]


class TestFarms:
    """Farm CRUD behaviour."""

    def test_farmer_can_create_farm(self, client_farmer, farmer):
        """Create returns 201, sets the farmer as owner."""
        response = client_farmer.post(
            "/api/v1/farms/", data=FARM_PAYLOAD, format="json"
        )
        assert response.status_code == 201
        body = _to_json(response)
        assert body["data"]["name"] == "Auma Farm"
        assert body["data"]["owner"] == farmer.id

    def test_buyer_cannot_create_farm(self, buyer):
        """Buyers get 403 when creating farms."""
        client = APIClient()
        client.force_authenticate(user=buyer)
        response = client.post("/api/v1/farms/", data=FARM_PAYLOAD, format="json")
        assert response.status_code == 403

    def test_anonymous_cannot_create_farm(self):
        """Anonymous requests get 401 when creating farms."""
        response = APIClient().post("/api/v1/farms/", data=FARM_PAYLOAD, format="json")
        assert response.status_code == 401

    def test_farmer_lists_only_own_farms(self, client_farmer, farm, other_farmer):
        """Another farmer's farm is not visible in the list."""
        Farm.objects.create(
            owner=other_farmer,
            name="Auma Farm",
            location="Lira",
            district="Lira",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        response = client_farmer.get("/api/v1/farms/")
        assert response.status_code == 200
        names = [f["name"] for f in _results(response)]
        assert names == ["Okello Family Farm"]

    def test_farmer_cannot_update_another_users_farm(self, client_farmer, other_farmer):
        """PATCH on another farmer's farm returns 404."""
        foreign = Farm.objects.create(
            owner=other_farmer,
            name="Foreign Farm",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        response = client_farmer.patch(
            f"/api/v1/farms/{foreign.id}/",
            data={"name": "Hijacked"},
            format="json",
        )
        assert response.status_code == 404

    def test_farmer_can_update_own_farm(self, client_farmer, farm):
        """PATCH updates the farm name."""
        response = client_farmer.patch(
            f"/api/v1/farms/{farm.id}/", data={"name": "Renamed Farm"}, format="json"
        )
        assert response.status_code == 200
        assert _to_json(response)["data"]["name"] == "Renamed Farm"

    def test_farm_rejects_non_positive_size(self, client_farmer):
        """Size must be greater than zero."""
        payload = dict(FARM_PAYLOAD, size="0")
        response = client_farmer.post("/api/v1/farms/", data=payload, format="json")
        assert response.status_code == 400
        assert "size" in _to_json(response)["errors"]

    def test_farm_delete_is_soft(self, client_farmer, farm):
        """DELETE hides the farm from normal queries but keeps the row."""
        response = client_farmer.delete(f"/api/v1/farms/{farm.id}/")
        assert response.status_code == 204
        assert Farm.objects.count() == 0
        assert Farm.all_objects.get(pk=farm.id).is_deleted is True

    def test_admin_views_soft_deleted_farm(self, admin, farm):
        """Admins see soft-deleted farms in the list."""
        farm.soft_delete()
        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get("/api/v1/farms/")
        assert response.status_code == 200
        assert len(_results(response)) == 1

    def test_admin_restores_soft_deleted_farm(self, admin, farm):
        """POST restore brings a deleted farm back."""
        farm.soft_delete()
        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.post(f"/api/v1/farms/{farm.id}/restore/")
        assert response.status_code == 200
        assert Farm.objects.get(pk=farm.id).is_deleted is False

    def test_farmer_cannot_restore(self, client_farmer, farm):
        """Regular farmers cannot call the restore endpoint."""
        farm.soft_delete()
        response = client_farmer.post(f"/api/v1/farms/{farm.id}/restore/")
        assert response.status_code == 403


class TestFields:
    """Field CRUD nested under a farm."""

    def test_farmer_creates_field_under_own_farm(self, client_farmer, farm):
        """Create returns 201 and binds to the farm from the URL."""
        response = client_farmer.post(
            f"/api/v1/farms/{farm.id}/fields/",
            data={"name": "Field B", "size": "3.00", "size_unit": "acres"},
            format="json",
        )
        assert response.status_code == 201
        assert _to_json(response)["data"]["farm"] == farm.id

    def test_farmer_cannot_create_field_under_foreign_farm(self, client_farmer, farm, other_farmer):
        """Nested create against another farmer's farm returns 404."""
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
            f"/api/v1/farms/{foreign.id}/fields/",
            data={"name": "Field B", "size": "3.00", "size_unit": "acres"},
            format="json",
        )
        assert response.status_code == 404

    def test_farmer_lists_fields_of_own_farm(self, client_farmer, farm, field, other_farmer):
        """List for an owned farm returns its fields."""
        Field.objects.create(
            farm=farm, name="Field B", size=Decimal("3"), size_unit="acres"
        )
        response = client_farmer.get(f"/api/v1/farms/{farm.id}/fields/")
        assert response.status_code == 200
        names = [f["name"] for f in _results(response)]
        assert names == ["Field A", "Field B"]

    def test_deleted_field_hidden_from_field_detail(self, client_farmer, field):
        """Soft-deleted field is not accessible through the normal detail URL."""
        field.soft_delete()
        response = client_farmer.get(f"/api/v1/fields/{field.id}/")
        assert response.status_code == 404

    def test_admin_sees_deleted_field(self, admin, field):
        """Admins can view soft-deleted fields."""
        field.soft_delete()
        client = APIClient()
        client.force_authenticate(user=admin)
        response = client.get(f"/api/v1/fields/{field.id}/")
        assert response.status_code == 200
        assert _to_json(response)["data"]["is_deleted"] is True

    def test_field_rejects_negative_size(self, client_farmer, farm):
        """Negative field size is rejected."""
        response = client_farmer.post(
            f"/api/v1/farms/{farm.id}/fields/",
            data={"name": "Bad", "size": "-1", "size_unit": "acres"},
            format="json",
        )
        assert response.status_code == 400
        assert "size" in _to_json(response)["errors"]


class TestCrops:
    """Crop CRUD with farm auto-resolved from the field."""

    def test_farmer_creates_crop_auto_resolves_farm(self, client_farmer, field, farm):
        """Provide field_id only; farm is derived from the field."""
        response = client_farmer.post(
            "/api/v1/crops/",
            data={
                "field_id": field.id,
                "crop_type": "maize",
                "variety": "Longe 5",
                "status": "PLANNED",
            },
            format="json",
        )
        assert response.status_code == 201
        body = _to_json(response)["data"]
        assert body["farm"] == farm.id
        assert body["field_name"] == "Field A"

    def test_farmer_cannot_use_field_from_foreign_farm(self, client_farmer, farm, other_farmer):
        """planting in a foreign field is rejected."""
        foreign = Farm.objects.create(
            owner=other_farmer,
            name="Foreign",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        foreign_field = Field.objects.create(
            farm=foreign, name="Foreign Field", size=Decimal("2"), size_unit="acres"
        )
        response = client_farmer.post(
            "/api/v1/crops/",
            data={"field_id": foreign_field.id, "crop_type": "maize"},
            format="json",
        )
        assert response.status_code == 400
        assert "own fields" in _to_json(response)["errors"]["field_id"][0]

    def test_crop_harvest_before_planting_rejected(self, client_farmer, field):
        """expected_harvest_date before planting_date is invalid."""
        response = client_farmer.post(
            "/api/v1/crops/",
            data={
                "field_id": field.id,
                "crop_type": "maize",
                "planting_date": "2026-09-01",
                "expected_harvest_date": "2026-08-01",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "cannot be before planting date" in _to_json(response)["errors"][
            "expected_harvest_date"
        ][0]

    def test_farmer_cannot_update_foreign_crop(self, client_farmer, other_farmer):
        """PATCH on a foreign crop returns 404."""
        other_farm = Farm.objects.create(
            owner=other_farmer,
            name="Other",
            location="Gulu",
            district="Gulu",
            size=Decimal("2"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        other_field = Field.objects.create(
            farm=other_farm, name="Other Field", size=Decimal("2"), size_unit="acres"
        )
        foreign_crop = Crop.objects.create(
            farm=other_farm, field=other_field, crop_type="maize"
        )
        response = client_farmer.patch(
            f"/api/v1/crops/{foreign_crop.id}/", data={"notes": "mine"}, format="json"
        )
        assert response.status_code == 404

    def test_status_choices_enforced(self, client_farmer, field):
        """An unknown status is rejected."""
        response = client_farmer.post(
            "/api/v1/crops/",
            data={"field_id": field.id, "crop_type": "maize", "status": "NOPE"},
            format="json",
        )
        assert response.status_code == 400


class TestCropActivities:
    """Crop activity CRUD nested under a crop."""

    def test_farmer_records_activity_on_own_crop(self, client_farmer, field):
        """Create returns 201 and binds to the crop from the URL."""
        crop = Crop.objects.create(farm=field.farm, field=field, crop_type="maize")
        response = client_farmer.post(
            f"/api/v1/crops/{crop.id}/activities/",
            data={
                "activity_type": "weeding",
                "date": timezone.localdate().isoformat(),
                "description": "Second weeding",
                "cost": "15000.00",
            },
            format="json",
        )
        assert response.status_code == 201
        assert _to_json(response)["data"]["crop"] == crop.id

    def test_activity_date_in_future_rejected(self, client_farmer, field):
        """Future activity dates are invalid."""
        crop = Crop.objects.create(farm=field.farm, field=field, crop_type="maize")
        response = client_farmer.post(
            f"/api/v1/crops/{crop.id}/activities/",
            data={
                "activity_type": "weeding",
                "date": "2030-01-01",
                "cost": "0",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "cannot be in the future" in _to_json(response)["errors"]["date"][0]

    def test_activity_on_foreign_crop_returns_404(self, client_farmer, farm, other_farmer):
        """Recording an activity on another farmer's crop is blocked."""
        foreign = Farm.objects.create(
            owner=other_farmer,
            name="Foreign",
            location="Kampala",
            district="Kampala",
            size=Decimal("3"),
            size_unit="acres",
            farm_type="crop_farming",
        )
        foreign_field = Field.objects.create(
            farm=foreign, name="FF", size=Decimal("2"), size_unit="acres"
        )
        foreign_crop = Crop.objects.create(
            farm=foreign, field=foreign_field, crop_type="maize"
        )
        response = client_farmer.post(
            f"/api/v1/crops/{foreign_crop.id}/activities/",
            data={"activity_type": "weeding", "date": "2026-09-01"},
            format="json",
        )
        assert response.status_code == 404

    def test_negative_activity_cost_rejected(self, client_farmer, field):
        """Negative costs are invalid."""
        crop = Crop.objects.create(farm=field.farm, field=field, crop_type="maize")
        response = client_farmer.post(
            f"/api/v1/crops/{crop.id}/activities/",
            data={"activity_type": "weeding", "date": "2026-09-01", "cost": "-5"},
            format="json",
        )
        assert response.status_code == 400
        assert "cost" in _to_json(response)["errors"]

    def test_buyer_cannot_record_activity(self, buyer, farm, field):
        """Buyers get 403 when posting activities."""
        crop = Crop.objects.create(farm=farm, field=field, crop_type="maize")
        client = APIClient()
        client.force_authenticate(user=buyer)
        response = client.post(
            f"/api/v1/crops/{crop.id}/activities/",
            data={"activity_type": "planting", "date": "2026-09-01"},
            format="json",
        )
        assert response.status_code == 403

    def test_activity_soft_delete(self, client_farmer, field):
        """Deleting an activity removes it from normal queries."""
        crop = Crop.objects.create(farm=field.farm, field=field, crop_type="maize")
        activity = CropActivity.objects.create(
            crop=crop,
            activity_type="planting",
            date=timezone.localdate(),
        )
        response = client_farmer.delete(f"/api/v1/activities/{activity.id}/")
        assert response.status_code == 204
        assert CropActivity.objects.count() == 0
        assert CropActivity.all_objects.get(pk=activity.id).is_deleted is True
