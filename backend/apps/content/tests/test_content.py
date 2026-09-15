"""Tests for the content module: categories, articles, search and admin permissions."""

import json

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.content.models import Article, ContentCategory


@pytest.fixture
def admin_user(db):
    """An administrator account."""
    return User.objects.create_user(
        username="admin1",
        email="admin1@example.com",
        password="StrongPass1",
        role=User.Roles.ADMIN,
        full_name="Admin One",
        phone="+256709234567",
    )


@pytest.fixture
def farmer(db):
    """A farmer account."""
    return User.objects.create_user(
        username="farmer1",
        email="farmer1@example.com",
        password="StrongPass1",
        role=User.Roles.FARMER,
        full_name="Okello James",
        phone="+256701234567",
    )


@pytest.fixture
def buyer(db):
    """A buyer account."""
    return User.objects.create_user(
        username="buyer1",
        email="buyer1@example.com",
        password="StrongPass1",
        role=User.Roles.BUYER,
        full_name="Buyer Sam",
        phone="+256703234567",
    )


@pytest.fixture
def client_admin(admin_user):
    """An API client authenticated as the admin."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def client_farmer(farmer):
    """An API client authenticated as the farmer."""
    client = APIClient()
    client.force_authenticate(user=farmer)
    return client


@pytest.fixture
def client_buyer(buyer):
    """An API client authenticated as the buyer."""
    client = APIClient()
    client.force_authenticate(user=buyer)
    return client


@pytest.fixture
def crops_category(db):
    """The seeded Crops content category."""
    return ContentCategory.objects.get(slug="crops")


@pytest.fixture
def livestock_category(db):
    """The seeded Livestock content category."""
    return ContentCategory.objects.get(slug="livestock")


@pytest.fixture
def articles(crops_category, livestock_category):
    """A published article, an unpublished article and a second published article."""
    published = Article.objects.create(
        title="How to grow maize",
        category=crops_category,
        content="Detailed guide on planting maize in Uganda.",
        is_published=True,
    )
    unpublished = Article.objects.create(
        title="Pest control drafts",
        content="Draft pest control content.",
        is_published=False,
    )
    published_other = Article.objects.create(
        title="Goat rearing basics",
        category=livestock_category,
        content="Getting started with goats.",
        is_published=True,
    )
    return published, unpublished, published_other


def _to_json(response):
    """Return the parsed JSON body from an API response."""
    return json.loads(response.content)


def _results(response):
    """Return the paginated results from a list endpoint response."""
    return _to_json(response)["data"]["results"]


class TestContentCategories:
    """Category seeding and listing."""

    def test_five_categories_seeded(self, db):
        """The five baseline content categories exist after migration."""
        names = set(ContentCategory.objects.values_list("slug", flat=True))
        expected = {
            "crops",
            "livestock",
            "farming-guides",
            "pest-information",
            "disease-information",
        }
        assert expected <= names

    def test_public_can_list_categories(self, client, db):
        """Listing content categories requires no authentication."""
        response = client.get("/api/v1/content/categories/")
        assert response.status_code == 200
        slugs = {row["slug"] for row in _results(response)}
        assert "crops" in slugs
        assert "livestock" in slugs


class TestArticles:
    """Article browse, search, admin permissions and slug generation."""

    def test_public_sees_only_published(self, client, articles, db):
        """Public users only see published articles."""
        _published, _unpublished, _published_other = articles
        response = client.get("/api/v1/content/articles/")
        assert response.status_code == 200
        titles = {row["title"] for row in _results(response)}
        assert "How to grow maize" in titles
        assert "Pest control drafts" not in titles

    def test_admin_sees_all_articles(self, client_admin, articles, db):
        """Administrators see both published and unpublished articles."""
        response = client_admin.get("/api/v1/content/articles/")
        assert response.status_code == 200
        titles = {row["title"] for row in _results(response)}
        assert "Pest control drafts" in titles
        assert "How to grow maize" in titles

    def test_public_can_view_article_detail(self, client, articles, db):
        """Published articles are accessible by id publicly."""
        published, _unpublished, _published_other = articles
        response = client.get(f"/api/v1/content/articles/{published.id}/")
        assert response.status_code == 200
        assert _to_json(response)["data"]["title"] == "How to grow maize"

    def test_farmer_cannot_create_article(self, client_farmer, db):
        """Farmers cannot create articles."""
        response = client_farmer.post(
            "/api/v1/content/articles/",
            {"title": "New article", "content": "Content."},
        )
        assert response.status_code == 403

    def test_buyer_cannot_delete_article(self, client_buyer, articles, db):
        """Buyers cannot delete articles."""
        published, _unpublished, _published_other = articles
        response = client_buyer.delete(f"/api/v1/content/articles/{published.id}/")
        assert response.status_code == 403

    def test_admin_creates_article(self, client_admin, crops_category, db):
        """An admin can create an article with auto-generated slug."""
        response = client_admin.post(
            "/api/v1/content/articles/",
            {
                "title": "Cassava farming tips",
                "content": "Best practices for cassava.",
                "category": crops_category.id,
            },
        )
        assert response.status_code == 201
        data = _to_json(response)["data"]
        assert data["title"] == "Cassava farming tips"
        assert data["category_name"] == "Crops"
        assert data["slug"] != ""
        assert data["author_name"] == "admin1"

    def test_admin_creates_article_without_category(self, client_admin, db):
        """An admin can create an article without assigning a category."""
        response = client_admin.post(
            "/api/v1/content/articles/",
            {"title": "General farming news", "content": "Update content."},
        )
        assert response.status_code == 201
        assert _to_json(response)["data"]["category"] is None

    def test_admin_updates_article(self, client_admin, articles, db):
        """An admin can update an article."""
        published, _unpublished, _published_other = articles
        response = client_admin.patch(
            f"/api/v1/content/articles/{published.id}/",
            {"title": "Maize farming complete guide", "is_published": False},
        )
        assert response.status_code == 200
        data = _to_json(response)["data"]
        assert data["title"] == "Maize farming complete guide"
        assert data["is_published"] is False

    def test_admin_soft_deletes_article(self, client_admin, articles, db):
        """An admin delete is a soft delete and the article is hidden from public."""
        published, _unpublished, _published_other = articles
        response = client_admin.delete(f"/api/v1/content/articles/{published.id}/")
        assert response.status_code == 204
        assert Article.all_objects.filter(id=published.id).exists()
        assert not Article.objects.filter(id=published.id).exists()

    def test_search_by_title(self, client, articles, db):
        """Searches filter articles by title."""
        response = client.get("/api/v1/content/articles/", {"search": "maize"})
        assert response.status_code == 200
        titles = {row["title"] for row in _results(response)}
        assert "How to grow maize" in titles
        assert "Pest control drafts" not in titles

    def test_filter_by_category(self, client, articles, crops_category, db):
        """Articles can be filtered by category."""
        response = client.get(
            "/api/v1/content/articles/", {"category": crops_category.id}
        )
        assert response.status_code == 200
        titles = {row["title"] for row in _results(response)}
        assert "How to grow maize" in titles
        assert "Goat rearing basics" not in titles
