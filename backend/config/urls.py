"""URL configuration for AgriConnect Uganda."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/farms/", include("apps.farms.urls")),
    path("api/v1/fields/", include("apps.farms.fields_urls")),
    path("api/v1/crops/", include("apps.farms.crops_urls")),
    path("api/v1/activities/", include("apps.farms.activities_urls")),
    path("api/v1/finance/", include("apps.finance.urls")),
    path("api/v1/marketplace/", include("apps.marketplace.urls")),
    path("api/v1/markets/", include("apps.markets.urls")),
    path("api/v1/content/", include("apps.content.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
