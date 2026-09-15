"""URL configuration for the finance app."""

from django.urls import path

from apps.finance import views

app_name = "finance"

urlpatterns = [
    path("expenses/", views.ExpenseListCreateView.as_view(), name="expense-list-create"),
    path("expenses/<int:pk>/", views.ExpenseDetailView.as_view(), name="expense-detail"),
    path("harvests/", views.HarvestListCreateView.as_view(), name="harvest-list-create"),
    path("harvests/<int:pk>/", views.HarvestDetailView.as_view(), name="harvest-detail"),
    path("sales/", views.SaleListCreateView.as_view(), name="sale-list-create"),
    path("sales/<int:pk>/", views.SaleDetailView.as_view(), name="sale-detail"),
    path("profit-loss/", views.ProfitLossView.as_view(), name="profit-loss"),
]
