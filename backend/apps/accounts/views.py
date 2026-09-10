"""Authentication and profile views."""

from typing import ClassVar

from rest_framework import permissions, status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.models import User
from apps.accounts.serializers import (
    AgriTokenObtainPairSerializer,
    LogoutSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    """Public registration for farmers and buyers. Returns tokens on success."""

    permission_classes: ClassVar[list[type]] = [permissions.AllowAny]
    throttle_scope = "register"
    serializer_class = RegisterSerializer

    def post(self, request):
        """Create the account and return JWT tokens."""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Authenticate with email or username and return JWT tokens."""

    permission_classes: ClassVar[list[type]] = [permissions.AllowAny]
    throttle_scope = "login"
    serializer_class = AgriTokenObtainPairSerializer

    def post(self, request):
        """Validate credentials and return fresh JWT tokens."""
        serializer = AgriTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """Blacklist the provided refresh token."""

    permission_classes: ClassVar[list[type]] = [permissions.IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request):
        """Invalidate the refresh token."""
        serializer = LogoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        token.blacklist()
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


class MeView(RetrieveUpdateAPIView):
    """View and update the authenticated user's profile."""

    permission_classes: ClassVar[list[type]] = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self) -> User:
        """Return the requesting user."""
        return self.request.user


class ThrottledTokenRefreshView(TokenRefreshView):
    """Token refresh with per-user rate limiting."""

    throttle_scope = "token_refresh"
