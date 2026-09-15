"""Views for expenses, harvests, sales and profit/loss."""

from decimal import Decimal

from django.db.models import Sum
from rest_framework import permissions, status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsFarmer
from apps.finance.models import Expense, Harvest, Sale
from apps.finance.serializers import (
    ExpenseSerializer,
    HarvestSerializer,
    ProfitLossSerializer,
    SaleSerializer,
)


def _is_admin(user: User) -> bool:
    """Return True for administrators, staff and superusers."""
    return bool(
        user.is_authenticated
        and (user.role == User.Roles.ADMIN or user.is_staff or user.is_superuser)
    )


class FarmerWriteOrReadMixin:
    """Require the FARMER role for write methods only."""

    def get_permissions(self):
        """Allow authenticated reads and farmer-only writes."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsFarmer()]


class ExpenseListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List expenses for the requesting farmer or create a new expense."""

    serializer_class = ExpenseSerializer

    def get_queryset(self):
        """Return expenses owned by the farmer, or all for admins."""
        user = self.request.user
        if _is_admin(user):
            return Expense.all_objects.select_related("farm", "crop").all()
        return (
            Expense.objects.filter(farm__owner=user)
            .select_related("farm", "crop")
            .all()
        )

    def get_serializer_context(self):
        """Pass request context for ownership validation."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class ExpenseDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single expense."""

    serializer_class = ExpenseSerializer

    def get_queryset(self):
        """Restrict access to the expense owner (or all for admins)."""
        user = self.request.user
        if _is_admin(user):
            return Expense.all_objects.filter(pk=self.kwargs["pk"]).select_related(
                "farm", "crop"
            )
        return Expense.objects.filter(farm__owner=user, pk=self.kwargs["pk"]).select_related(
            "farm", "crop"
        )

    def get_serializer_context(self):
        """Pass request context for ownership validation."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the expense instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HarvestListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List harvests for the requesting farmer or create a new harvest."""

    serializer_class = HarvestSerializer

    def get_queryset(self):
        """Return harvests owned by the farmer, or all for admins."""
        user = self.request.user
        if _is_admin(user):
            return Harvest.all_objects.select_related("farm", "crop").all()
        return (
            Harvest.objects.filter(farm__owner=user)
            .select_related("farm", "crop")
            .all()
        )

    def get_serializer_context(self):
        """Pass request context for ownership validation."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class HarvestDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single harvest."""

    serializer_class = HarvestSerializer

    def get_queryset(self):
        """Restrict access to the harvest owner (or all for admins)."""
        user = self.request.user
        if _is_admin(user):
            return Harvest.all_objects.filter(pk=self.kwargs["pk"]).select_related(
                "farm", "crop"
            )
        return Harvest.objects.filter(farm__owner=user, pk=self.kwargs["pk"]).select_related(
            "farm", "crop"
        )

    def get_serializer_context(self):
        """Pass request context for ownership validation."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the harvest instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SaleListCreateView(FarmerWriteOrReadMixin, ListCreateAPIView):
    """List sales for the requesting farmer or create a new sale."""

    serializer_class = SaleSerializer

    def get_queryset(self):
        """Return sales made by the farmer, or all for admins."""
        user = self.request.user
        if _is_admin(user):
            return Sale.all_objects.select_related("farm", "crop", "farmer").all()
        return (
            Sale.objects.filter(farmer=user)
            .select_related("farm", "crop", "farmer")
            .all()
        )

    def perform_create(self, serializer) -> None:
        """Set the creating farmer as the sale owner."""
        serializer.save(farmer=self.request.user)

    def get_serializer_context(self):
        """Pass request context for ownership validation."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class SaleDetailView(FarmerWriteOrReadMixin, RetrieveUpdateDestroyAPIView):
    """Retrieve, update or soft-delete a single sale."""

    serializer_class = SaleSerializer

    def get_queryset(self):
        """Restrict access to the sale owner (or all for admins)."""
        user = self.request.user
        if _is_admin(user):
            return Sale.all_objects.filter(pk=self.kwargs["pk"]).select_related(
                "farm", "crop", "farmer"
            )
        return Sale.objects.filter(farmer=user, pk=self.kwargs["pk"]).select_related(
            "farm", "crop", "farmer"
        )

    def get_serializer_context(self):
        """Pass request context for ownership validation."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the sale instead of removing the row."""
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfitLossView(APIView):
    """Calculate basic profit/loss for a farmer, filterable by farm, crop and date range."""

    def get(self, request):
        """Return total expenses, total revenue and profit/loss for the requesting farmer."""
        serializer = ProfitLossSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        filters = serializer.validated_data

        user = request.user
        expense_qs = Expense.objects.filter(farm__owner=user)
        sale_qs = Sale.objects.filter(farmer=user)

        farm_id = filters.get("farm_id")
        crop_id = filters.get("crop_id")
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if farm_id:
            expense_qs = expense_qs.filter(farm_id=farm_id)
            sale_qs = sale_qs.filter(farm_id=farm_id)
        if crop_id:
            expense_qs = expense_qs.filter(crop_id=crop_id)
            sale_qs = sale_qs.filter(crop_id=crop_id)
        if start_date:
            expense_qs = expense_qs.filter(date__gte=start_date)
            sale_qs = sale_qs.filter(sale_date__gte=start_date)
        if end_date:
            expense_qs = expense_qs.filter(date__lte=end_date)
            sale_qs = sale_qs.filter(sale_date__lte=end_date)

        total_expenses = expense_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        total_revenue = sale_qs.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")
        profit_loss = total_revenue - total_expenses

        return Response(
            {
                "total_expenses": str(total_expenses),
                "total_revenue": str(total_revenue),
                "profit_loss": str(profit_loss),
                "expense_count": expense_qs.count(),
                "sale_count": sale_qs.count(),
            }
        )
