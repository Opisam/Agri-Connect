"""Serializers for produce categories, listings and orders."""

import django.core.exceptions
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import User
from apps.marketplace.models import Listing, Order, ProduceCategory


class ProduceCategorySerializer(serializers.ModelSerializer):
    """Serialize a produce category."""

    class Meta:
        model = ProduceCategory
        fields = ("id", "name", "slug", "description")


class ListingSerializer(serializers.ModelSerializer):
    """Serialize a marketplace listing."""

    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id",
            "farmer",
            "farmer_name",
            "product_name",
            "category",
            "category_name",
            "quantity",
            "quantity_remaining",
            "unit",
            "price_per_unit",
            "location",
            "district",
            "available_from",
            "description",
            "image",
            "status",
            "status_display",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "farmer",
            "farmer_name",
            "category_name",
            "quantity_remaining",
            "status_display",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        )

    def validate_available_from(self, value):
        """Available-from must be today or a future date."""
        if value < timezone.localdate():
            raise serializers.ValidationError(
                "available_from must be today or a future date."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        """Prevent quantity edits and handle expired-listing reactivation."""
        if self.instance is not None and "quantity" in attrs:
            raise serializers.ValidationError(
                {"quantity": "The listing quantity cannot be changed after creation."}
            )
        user = self.context["request"].user
        if (
            self.instance is not None
            and not _is_admin(user)
            and self.instance.farmer_id != user.id
        ):
            raise serializers.ValidationError("You can only manage your own listings.")
        if self.instance is not None:
            new_status = attrs.get("status", self.instance.status)
            if (
                new_status == Listing.Statuses.ACTIVE
                and self.instance.status == Listing.Statuses.EXPIRED
            ):
                available_from = attrs.get(
                    "available_from", self.instance.available_from
                )
                if available_from < timezone.localdate():
                    raise serializers.ValidationError(
                        {
                            "status": (
                                "Set available_from to today or a future date to "
                                "reactivate an expired listing."
                            )
                        }
                    )
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    """Serialize an order, enforcing quantity rules and status transitions."""

    listing_product_name = serializers.CharField(
        source="listing.product_name", read_only=True
    )
    listing_unit = serializers.CharField(source="listing.unit", read_only=True)
    listing_price_per_unit = serializers.CharField(
        source="listing.price_per_unit", read_only=True
    )
    listing_quantity_remaining = serializers.CharField(
        source="listing.quantity_remaining", read_only=True
    )
    buyer_name = serializers.CharField(source="buyer.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "listing",
            "listing_product_name",
            "listing_unit",
            "listing_price_per_unit",
            "listing_quantity_remaining",
            "buyer",
            "buyer_name",
            "quantity",
            "total_price",
            "status",
            "status_display",
            "notes",
            "farmer_notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "listing_product_name",
            "listing_unit",
            "listing_price_per_unit",
            "listing_quantity_remaining",
            "buyer",
            "buyer_name",
            "total_price",
            "status_display",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict) -> dict:
        """Validate quantities when placing an order."""
        if self.instance is None:
            listing = attrs.get("listing")
            quantity = attrs.get("quantity")
            if listing is None or quantity is None:
                return attrs
            if listing.status != Listing.Statuses.ACTIVE:
                raise serializers.ValidationError(
                    "Orders can only be placed on active listings."
                )
            if quantity > listing.quantity_remaining:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            f"Only {listing.quantity_remaining} {listing.unit} "
                            "are available for this listing."
                        )
                    }
                )
        return attrs

    def update(self, instance: Order, validated_data: dict) -> Order:
        """Apply status transitions and persisted notes for the right actor."""
        user: User = self.context["request"].user
        quantity = validated_data.get("quantity")
        if quantity is not None and quantity != instance.quantity:
            raise serializers.ValidationError(
                {"quantity": "The order quantity cannot be changed."}
            )
        validated_data.pop("quantity", None)

        is_farmer = instance.listing.farmer_id == user.id
        is_buyer = instance.buyer_id == user.id

        new_status = validated_data.pop("status", None)
        if new_status is not None and new_status != instance.status:
            transitions: dict[str, tuple[callable, bool]] = {
                Order.Statuses.ACCEPTED: (instance.accept, is_farmer),
                Order.Statuses.REJECTED: (instance.reject, is_farmer),
                Order.Statuses.COMPLETED: (instance.complete, is_farmer),
                Order.Statuses.CANCELLED: (instance.cancel, is_buyer),
            }
            if new_status not in transitions:
                raise serializers.ValidationError(
                    {"status": "This status change is not allowed for your account."}
                )
            transition, allowed = transitions[new_status]
            if not allowed:
                raise serializers.ValidationError(
                    {"status": "This status change is not allowed for your account."}
                )
            transition_kwargs = {}
            if new_status in (Order.Statuses.ACCEPTED, Order.Statuses.REJECTED):
                transition_kwargs["farmer_notes"] = validated_data.get("farmer_notes")
            try:
                transition(**transition_kwargs)
            except django.core.exceptions.ValidationError as exc:
                if getattr(exc, "message_dict", None):
                    raise serializers.ValidationError(exc.message_dict) from exc
                raise serializers.ValidationError(exc.messages) from exc
            return instance

        if "farmer_notes" in validated_data and is_farmer:
            instance.farmer_notes = validated_data["farmer_notes"]
        if "notes" in validated_data and is_buyer:
            instance.notes = validated_data["notes"]
        instance.save()
        return instance


def _is_admin(user: User) -> bool:
    """Return True for administrators, staff and superusers."""
    return bool(
        user.is_authenticated
        and (user.role == User.Roles.ADMIN or user.is_staff or user.is_superuser)
    )
