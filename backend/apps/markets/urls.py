"""URL configuration for the markets app."""

from django.urls import path

from apps.markets import views

app_name = "markets"

urlpatterns = [
    path("", views.MarketListCreateView.as_view(), name="market-list-create"),
    path("<int:pk>/", views.MarketDetailView.as_view(), name="market-detail"),
    path(
        "prices/current/",
        views.MarketPriceCurrentListView.as_view(),
        name="market-price-current",
    ),
    path(
        "prices/history/",
        views.MarketPriceHistoryListView.as_view(),
        name="market-price-history",
    ),
    path(
        "prices/",
        views.MarketPriceListCreateView.as_view(),
        name="market-price-list-create",
    ),
    path(
        "prices/<int:pk>/",
        views.MarketPriceDetailView.as_view(),
        name="market-price-detail",
    ),
]
