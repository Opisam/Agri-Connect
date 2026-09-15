"""URL configuration for the marketplace app."""

from django.urls import path

from apps.marketplace import views

app_name = "marketplace"

urlpatterns = [
    path("categories/", views.ProduceCategoryListView.as_view(), name="category-list"),
    path("listings/", views.ListingListCreateView.as_view(), name="listing-list-create"),
    path("listings/<int:pk>/", views.ListingDetailView.as_view(), name="listing-detail"),
    path("orders/", views.OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:pk>/", views.OrderDetailView.as_view(), name="order-detail"),
]
