"""Serializers for authentication and user profile."""

import random
import string
from typing import ClassVar

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.utils import validate_ugandan_phone


class RegisterSerializer(serializers.ModelSerializer):
    """Create a farmer or buyer account."""

    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    phone = serializers.CharField(max_length=20, required=True)

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "phone",
            "email",
            "password",
            "role",
            "location",
            "district",
            "created_at",
        )
        extra_kwargs: ClassVar[dict] = {
            "full_name": {"required": True},
            "location": {"required": False, "allow_blank": True},
            "district": {"required": False, "allow_blank": True},
        }
        read_only_fields = ("id", "created_at")

    def validate_role(self, value: str) -> str:
        """Reject roles other than FARMER or BUYER for public registration."""
        if value not in (User.Roles.FARMER, User.Roles.BUYER):
            raise serializers.ValidationError("Role must be either FARMER or BUYER.")
        return value

    def validate_phone(self, value: str) -> str:
        """Normalize and validate the Ugandan phone number."""
        try:
            return validate_ugandan_phone(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate_email(self, value: str) -> str:
        """Ensure the email address is unique and lowercased."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        """Create the user with a generated username and a hashed password."""
        password = validated_data.pop("password")
        username = validated_data.pop(
            "username",
            self._generate_username(validated_data["full_name"]),
        )
        user = User.objects.create_user(
            username=username,
            password=password,
            is_active=True,
            **validated_data,
        )
        return user

    @staticmethod
    def _generate_username(full_name: str) -> str:
        """Generate a unique-looking username from the user's first name."""
        base = (
            "".join(ch for ch in full_name.lower().split()[0:1] if ch.isalnum())
            if full_name
            else "user"
        ) or "user"
        suffix = "".join(random.choices(string.digits, k=5))
        return f"{base}.{suffix}"

    def to_representation(self, instance):
        """Hide the email from the public registration response."""
        data = super().to_representation(instance)
        data.pop("email", None)
        return data


class AgriTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Exchange credentials for JWT tokens using email or username."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("username", None)
        self.fields["identifier"] = serializers.CharField()

    def validate(self, attrs):
        """Authenticate the user and enforce account lockout rules."""
        identifier = attrs.pop("identifier", "")
        password = attrs.get("password")

        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
        else:
            user = User.objects.filter(username__iexact=identifier).first()

        if user is not None and user.is_locked:
            raise serializers.ValidationError(
                "Account temporarily locked due to too many failed attempts. "
                "Try again in 15 minutes."
            )

        username = user.get_username() if user else identifier

        auth_user = authenticate(username=username, password=password)
        if auth_user is None or not auth_user.is_active:
            if user is not None:
                user.record_failed_login()
            from rest_framework import exceptions

            raise exceptions.AuthenticationFailed(
                "No active account found with the given credentials",
                code="no_active_account",
            )

        user.reset_failed_login()
        attrs["user"] = auth_user
        return {"user": auth_user}


class LogoutSerializer(serializers.Serializer):
    """Blacklist a refresh token on logout."""

    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        """Parse the refresh token and confirm it belongs to the authenticated user."""
        try:
            token = RefreshToken(attrs["refresh"])
        except Exception as exc:
            raise serializers.ValidationError(
                {"refresh": "Invalid or expired refresh token."}
            ) from exc

        user = getattr(self.context.get("request"), "user", None)
        if user is not None and str(token.get("user_id")) != str(user.id):
            raise serializers.ValidationError(
                {"refresh": "Token does not belong to the authenticated user."}
            )
        attrs["token"] = token
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Read/update the authenticated user's profile."""

    password = serializers.CharField(write_only=True, required=False, min_length=8, max_length=128)
    phone = serializers.CharField(max_length=20, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "phone",
            "email",
            "role",
            "location",
            "district",
            "profile_image",
            "password",
            "date_joined",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "username", "role", "date_joined", "created_at", "updated_at")
        extra_kwargs: ClassVar[dict] = {
            "phone": {"required": False},
            "email": {"required": False},
            "profile_image": {"required": False},
        }

    def validate_phone(self, value: str) -> str:
        """Normalize the phone number when provided."""
        if value:
            try:
                return validate_ugandan_phone(value)
            except ValueError as exc:
                raise serializers.ValidationError(str(exc)) from exc
        return value

    def validate_email(self, value: str) -> str:
        """Enforce email uniqueness while allowing the user to keep their own."""
        if value:
            existing = User.objects.filter(email__iexact=value)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError("A user with this email already exists.")
            return value.lower()
        return value

    def update(self, instance, validated_data):
        """Apply profile changes and set a new password when supplied."""
        password = validated_data.pop("password", None)
        profile_image = validated_data.pop("profile_image", None)
        if profile_image is not None:
            instance.profile_image = profile_image
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance
