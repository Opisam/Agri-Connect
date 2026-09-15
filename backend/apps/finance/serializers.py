"""Serializers for expenses, harvests, sales and profit/loss."""

from rest_framework import serializers

from apps.accounts.models import User
from apps.farms.models import Crop, Farm
from apps.finance.models import Expense, Harvest, Sale


class ExpenseSerializer(serializers.ModelSerializer):
    """Serialize an expense record."""

    farm_name = serializers.CharField(source="farm.name", read_only=True)
    crop_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Expense
        fields = (
            "id",
            "farm",
            "farm_name",
            "crop",
            "crop_name",
            "category",
            "category_display",
            "amount",
            "date",
            "description",
            "notes",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "farm_name",
            "crop_name",
            "category_display",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def get_crop_name(self, obj: Expense) -> str | None:
        """Return the display name of the linked crop, or None."""
        if obj.crop:
            return obj.crop.get_crop_type_display()
        return None

    def validate_farm(self, value: Farm) -> Farm:
        """Ensure the farmer owns the selected farm."""
        user = self.context["request"].user
        if not _is_admin(user) and value.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only add expenses to your own farms."
            )
        return value

    def validate_crop(self, value: Crop | None) -> Crop | None:
        """Ensure the farmer owns the selected crop."""
        if value is None:
            return value
        user = self.context["request"].user
        if not _is_admin(user) and value.farm.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only reference your own crops."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        """Check that the crop belongs to the selected farm."""
        farm = attrs.get("farm")
        crop = attrs.get("crop")
        if crop is not None and farm is not None and crop.farm_id != farm.id:
            raise serializers.ValidationError(
                {"crop": "The selected crop does not belong to this farm."}
            )
        return attrs


class HarvestSerializer(serializers.ModelSerializer):
    """Serialize a harvest record."""

    farm_name = serializers.CharField(source="farm.name", read_only=True)
    crop_name = serializers.SerializerMethodField()

    class Meta:
        model = Harvest
        fields = (
            "id",
            "farm",
            "farm_name",
            "crop",
            "crop_name",
            "quantity",
            "unit",
            "harvest_date",
            "notes",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "farm_name",
            "crop_name",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def get_crop_name(self, obj: Harvest) -> str:
        """Return the display name of the linked crop."""
        return obj.crop.get_crop_type_display()

    def validate_farm(self, value: Farm) -> Farm:
        """Ensure the farmer owns the selected farm."""
        user = self.context["request"].user
        if not _is_admin(user) and value.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only add harvests to your own farms."
            )
        return value

    def validate_crop(self, value: Crop) -> Crop:
        """Ensure the farmer owns the selected crop."""
        user = self.context["request"].user
        if not _is_admin(user) and value.farm.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only reference your own crops."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        """Check that the crop belongs to the selected farm."""
        farm = attrs.get("farm")
        crop = attrs.get("crop")
        if crop is not None and farm is not None and crop.farm_id != farm.id:
            raise serializers.ValidationError(
                {"crop": "The selected crop does not belong to this farm."}
            )
        return attrs


class SaleSerializer(serializers.ModelSerializer):
    """Serialize a sale record. Total is auto-calculated."""

    farm_name = serializers.CharField(source="farm.name", read_only=True)
    crop_name = serializers.SerializerMethodField()
    farmer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Sale
        fields = (
            "id",
            "farmer",
            "farm",
            "farm_name",
            "crop",
            "crop_name",
            "quantity",
            "unit",
            "unit_price",
            "total_amount",
            "buyer_name",
            "buyer_contact",
            "sale_date",
            "notes",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "farmer",
            "farm_name",
            "crop_name",
            "total_amount",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def get_crop_name(self, obj: Sale) -> str | None:
        """Return the display name of the linked crop, or None."""
        if obj.crop:
            return obj.crop.get_crop_type_display()
        return None

    def validate_farm(self, value: Farm) -> Farm:
        """Ensure the farmer owns the selected farm."""
        user = self.context["request"].user
        if not _is_admin(user) and value.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only record sales for your own farms."
            )
        return value

    def validate_crop(self, value: Crop | None) -> Crop | None:
        """Ensure the farmer owns the selected crop."""
        if value is None:
            return value
        user = self.context["request"].user
        if not _is_admin(user) and value.farm.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only reference your own crops."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        """Check crop-farm ownership and pre-calculate total."""
        farm = attrs.get("farm")
        crop = attrs.get("crop")
        if crop is not None and farm is not None and crop.farm_id != farm.id:
            raise serializers.ValidationError(
                {"crop": "The selected crop does not belong to this farm."}
            )
        quantity = attrs.get("quantity")
        unit_price = attrs.get("unit_price")
        if quantity is not None and unit_price is not None:
            attrs["total_amount"] = quantity * unit_price
        return attrs


class ProfitLossSerializer(serializers.Serializer):
    """Filter parameters for the profit/loss endpoint."""

    farm_id = serializers.IntegerField(required=False)
    crop_id = serializers.IntegerField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)


def _is_admin(user: User) -> bool:
    """Return True for administrators, staff and superusers."""
    return bool(
        user.is_authenticated
        and (user.role == User.Roles.ADMIN or user.is_staff or user.is_superuser)
    )
