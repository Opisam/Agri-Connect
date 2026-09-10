"""Serializers for farms, fields, crops and crop activities."""

from datetime import date
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from apps.farms.models import Crop, CropActivity, Farm, Field


class FarmSerializer(serializers.ModelSerializer):
    """Serialize a farm owned by the requesting farmer."""

    field_count = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = (
            "id",
            "owner",
            "name",
            "location",
            "district",
            "subcounty",
            "size",
            "size_unit",
            "farm_type",
            "description",
            "field_count",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "field_count",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def get_field_count(self, obj: Farm) -> int:
        """Return the number of active fields on the farm."""
        return obj.fields.count()

    def validate_size(self, value: Decimal) -> Decimal:
        """Reject non-positive sizes."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Farm size must be greater than zero.")
        return value


class FieldSerializer(serializers.ModelSerializer):
    """Serialize a field within a farm."""

    farm = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Field
        fields = (
            "id",
            "farm",
            "name",
            "size",
            "size_unit",
            "description",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = ("id", "farm", "created_at", "updated_at", "is_deleted", "deleted_at")

    def validate_size(self, value: Decimal) -> Decimal:
        """Reject non-positive sizes."""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Field size must be greater than zero.")
        return value


class CropSerializer(serializers.ModelSerializer):
    """Serialize a crop record, auto-resolving the farm from its field."""

    field_id = serializers.PrimaryKeyRelatedField(
        queryset=Field.objects.all(),
        source="field",
        write_only=True,
    )
    farm = serializers.PrimaryKeyRelatedField(read_only=True)
    farm_name = serializers.CharField(source="farm.name", read_only=True)
    field_name = serializers.CharField(source="field.name", read_only=True)
    crop_type_display = serializers.CharField(source="get_crop_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Crop
        fields = (
            "id",
            "farm",
            "farm_name",
            "field_id",
            "field_name",
            "crop_type",
            "crop_type_display",
            "variety",
            "planting_date",
            "expected_harvest_date",
            "status",
            "status_display",
            "notes",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "farm",
            "farm_name",
            "field_name",
            "crop_type_display",
            "status_display",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def validate_field_id(self, value: Field) -> Field:
        """Restrict crops to fields on farms owned by the requesting user."""
        user = self.context["request"].user
        if value.farm.owner_id != user.id:
            raise serializers.ValidationError("You can only plant crops in your own fields.")
        return value

    def validate(self, attrs: dict) -> dict:
        """Bind the crop to its field's farm and check date ordering."""
        field = attrs.get("field")
        if field is not None:
            attrs["farm"] = field.farm

        planting_date = attrs.get("planting_date")
        expected_harvest_date = attrs.get("expected_harvest_date")
        if planting_date and planting_date > date.today():
            raise serializers.ValidationError(
                {"planting_date": "Planting date cannot be in the future."}
            )
        if (
            planting_date
            and expected_harvest_date
            and expected_harvest_date < planting_date
        ):
            raise serializers.ValidationError(
                {"expected_harvest_date": "Expected harvest date cannot be before planting date."}
            )
        return attrs


class CropActivitySerializer(serializers.ModelSerializer):
    """Serialize a farming activity recorded against a crop."""

    crop = serializers.PrimaryKeyRelatedField(read_only=True)
    activity_type_display = serializers.CharField(
        source="get_activity_type_display", read_only=True
    )

    class Meta:
        model = CropActivity
        fields = (
            "id",
            "crop",
            "activity_type",
            "activity_type_display",
            "date",
            "description",
            "cost",
            "notes",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "crop",
            "activity_type_display",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def validate_date(self, value: date) -> date:
        """Reject activity dates in the future."""
        if value > timezone.localdate():
            raise serializers.ValidationError("Activity date cannot be in the future.")
        return value

    def validate_cost(self, value: Decimal) -> Decimal:
        """Reject negative costs."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Cost cannot be negative.")
        return value
