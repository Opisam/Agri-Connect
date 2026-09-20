# AgriConnect Uganda

> Digital agricultural platform helping Ugandan farmers manage farms, understand finances, connect with buyers, and access market information — on the web and on mobile.

**Manage your farm → Understand your finances → Find better market opportunities.**

AgriConnect Uganda is a full-stack, role-based agricultural platform. A central **Django REST API** serves a **React (web)** client and a **React Native (Expo)** mobile client, backed by **PostgreSQL**. All monetary values are in **UGX** (Ugandan Shillings).

---

## Why AgriConnect? — Problem

Ugandan farmers lose value every season because of fragmented tools and information:

- **Market information gaps** — little access to current produce prices across markets.
- **Difficulty finding buyers** — produce is ready but connecting with buyers is manual and slow.
- **Poor farm record keeping** — farms, fields, crops, expenses, harvests and sales live in heads or scattered notebooks, making it impossible to tell if an activity is profitable.
- **Fragmented knowledge** — agricultural guides and price data are spread across disconnected sources.

AgriConnect centralizes farm management, farm finance, and farmer-to-buyer commerce into one platform available on any device.

---

## Features

### Authentication & accounts
- Register as **Farmer** or **Buyer** (admin accounts created via Django admin only).
- JWT login with access tokens (60 min) and refresh tokens (7 days); logout via server-side **token blacklist**.
- Ugandan phone validation (normalized to `+256…`), password policy, account lockout after failed logins, rate limiting.
- Profile management with optional image upload.

### Farm management
- **Farms** (size with accepted units: acres / hectares / square meters) with nested **Fields**.
- **Crops** per field — the farm is auto-resolved from the field; lifecycle from `PLANNED` to `HARVESTED`.
- **Crop Activities** — land prep, planting, weeding, fertilization, pest control, irrigation, harvesting — with costs.
- Soft deletes on all farm data with admin restore; strict per-farmer ownership checks.

### Farm finance
- **Expenses** by category (seeds, fertilizer, labour, transport, …), **Harvests** (yield), and **Sales** (total auto-calculated = quantity × unit price).
- **Profit / Loss** endpoint — expenses vs revenue, filterable by farm, crop, and date range.

### Marketplace
- Database-driven **produce categories** (cereals, legumes, fruits, vegetables, roots & tubers, coffee, livestock, …).
- **Listings** with optional image (≤10 MB), tracked available quantity (`quantity_remaining`), automatic `SOLD` at zero and 90-day expiry (`expire_listings` command).
- Search, filter and ordering on listings (product, category, district, price range).
- **Orders** with quantity reservation: accept deducts stock, reject/cancel restores it; full `PENDING → ACCEPTED → COMPLETED` lifecycle with in-app notifications at each step.

### Market information
- **Markets** (5 seeded: Kampala, Lira, Gulu, Mbarara, Jinja) and **market prices** with **append-only price history**, plus `current` and `history` endpoints for price trends.

### Knowledge & notifications
- Admin-published **agricultural articles** with categories (crops, livestock, farming guides, pest & disease info), search and public browse.
- **In-app notifications** for order events (received → farmer; accepted / rejected / completed → buyer) with unread counts.

### Multi-platform clients
- **Web (React + TypeScript + Vite + Bootstrap)** — marketing home, auth, farmer dashboard, farm/finance/marketplace/market-price/guides modules, order workflows, notification bell.
- **Mobile (React Native + Expo + TypeScript)** — same workflows on small screens: auth, farms/fields/crops/activities, expenses/harvests/sales, marketplace ordering, orders, market prices + history, guides, notifications. Tokens stored in **SecureStore**; silent token refresh; lightweight payloads for low-bandwidth connections.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python 3.13+, Django 6, Django REST Framework, SimpleJWT, django-filter, django-environ, psycopg (v3), Pillow |
| API style | RESTful, versioned (`/api/v1/`), consistent `{status, data}` / `{status, error}` envelope, pagination, search/filter/ordering |
| Data | PostgreSQL (primary), SQLite (local dev fallback) |
| Web | React 19, TypeScript 6, Vite 8, React Router 7, Axios, Bootstrap 5 + Bootstrap Icons, Vitest, oxlint |
| Mobile | React Native 0.86 / Expo SDK 57, TypeScript, React Navigation, Axios, Expo SecureStore, Jest (jest-expo) |
| Quality | ruff, pytest (pytest-django), coverage (80% gate), Vitest, Jest |
| CI/CD | GitHub Actions — backend / web / mobile workflows on push & PR against `main` and `dev` |

---

## Architecture

```
                ┌──────────────────────┐
                │      PostgreSQL      │
                └──────────▲───────────┘
                           │
                ┌──────────┴───────────┐
                │    Django REST API   │
                │  (config + 7 apps)   │
                │  auth · farms ·      │
                │  finance · market-   │
                │  place · markets ·   │
                │  content · notif.    │
                └──────────▲───────────┘
                    REST / JSON / JWT
              ┌────────────┴────────────┐
              ▼                         ▼
     React Web (Vite)         React Native (Expo)
     TypeScript               TypeScript
        └──────────┬──────────┘
                   ▼
         Same JSON API / same business rules
```

Backend business logic is the single source of truth — both clients consume the same API and implement no separate rules.

```
backend/   Django 6 + DRF (config/ + apps/{accounts,farms,finance,marketplace,markets,content,notifications})
web/       React 19 + TypeScript + Vite SPA
mobile/    React Native (Expo) + TypeScript app
.github/   GitHub Actions CI/CD workflows
```

---

## Getting Started

Requirements: [Python 3.13+](https://www.python.org/downloads/), [Node.js 22+](https://nodejs.org/), and optionally [PostgreSQL](https://www.postgresql.org/).

### 1. Backend (Django REST API)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # (Windows)  ·  source .venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
Copy-Item .env.example .env            # then edit values (see below)
python manage.py migrate
python manage.py createsuperuser       # optional admin account
python manage.py runserver
```

- API: `http://localhost:8000/api/v1/` · Django admin: `http://localhost:8000/admin/`
- `.env` essentials:
  - `DATABASE_URL=postgres://user:password@localhost:5432/agriconnect` for PostgreSQL, or `sqlite:///db.sqlite3` for zero-setup local dev.
  - `DEBUG=True` during development; `SECRET_KEY` must be overridden in production.
- Lint & test: `ruff check apps config` and `pytest`.

### 2. Web app (React + Vite)

```powershell
cd web
npm install
npm run dev
```

- Dev server: `http://localhost:5173` (proxies `/api` → `http://localhost:8000`).
- Scripts: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

### 3. Mobile app (React Native + Expo)

```powershell
cd mobile
npm install
npm start          # then press a / i / w, or scan the QR code in Expo Go
```

- Scripts: `npm run android|ios|web`, `npm run typecheck`, `npm run test`.
- API base URL auto-detects your dev machine (Metro host). Point the app at a specific server with `EXPO_PUBLIC_API_BASE_URL` in `.env.local` (see `mobile/.env.example`).

### Seeded demo data

Migrations seed the platform so it is usable immediately:

- **8 produce categories** (Cereals, Legumes, Fruits, Vegetables, Roots & tubers, Coffee, Livestock, Other)
- **10 expense categories** (Seeds, Fertilizer, Pesticides, Labour, Transport, …)
- **5 content categories** (Crops, Livestock, Farming guides, Pest & Disease information)
- **5 markets** (Kampala, Lira, Gulu, Mbarara, Jinja)

Register a farmer account in the app, then add a farm → field → crop → expenses → harvest → sale → listing, or register as a buyer to browse the marketplace and place orders.

---

## API Overview

Consistent response envelopes and versioned endpoints under `/api/v1/`:

| Module | Endpoints |
|---|---|
| Auth | `/auth/register/`, `/auth/login/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/me/` |
| Farms | `/farms/`, `/farms/{id}/fields/`, `/fields/`, `/crops/`, `/crops/{id}/activities/`, `/activities/` |
| Finance | `/finance/expenses/`, `/finance/harvests/`, `/finance/sales/`, `/finance/profit-loss/` |
| Marketplace | `/marketplace/categories/`, `/marketplace/listings/`, `/marketplace/orders/` |
| Markets | `/markets/`, `/markets/prices/`, `/markets/prices/current/`, `/markets/prices/history/` |
| Content | `/content/categories/`, `/content/articles/` |
| Notifications | `/notifications/`, `/notifications/unread/`, `/notifications/mark-all-read/` |

Every successful response returns `{"status": "success", "data": …}`; errors return `{"status": "error", "message": …, "errors": {…}}`. Collections are paginated (page size 20, max 100) with search, filtering and ordering support.

---

## PROJECT SCREENSHOTS
![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-5.png)

### Automated tests — 222 passing

| Suite | Framework | Tests |
|---|---|---|
| Backend (unit + API + integration) | pytest / pytest-django | **159** |
| Web (components, forms, auth, routes) | Vitest + Testing Library | **31** |
| Mobile (screens, navigation, auth, ordering) | Jest (jest-expo) + RNTL | **32** |

Coverage: backend enforces an 80% line-coverage gate (`coverage`), e.g. order quantity reservation, profit/loss math, price-history preservation, marketplace workflows, and role/permission enforcement are all tested end-to-end.

### CI/CD (GitHub Actions)

Every push and pull request against `main` and `dev` is validated automatically — PRs cannot merge while a required check fails:

| Workflow | Checks |
|---|---|
| `backend.yml` | ruff lint · Django system checks · **pytest against PostgreSQL 18** · coverage artifact |
| `web.yml` | oxlint · TypeScript typecheck · Vitest · production build |
| `mobile.yml` | TypeScript typecheck · Jest · Expo config validation |

### See it working (demo)

1. Start the backend and web app (see [Getting Started](#getting-started)); the database comes pre-seeded with categories and markets.
2. Register a **Farmer**, create a farm → field → crop, record expenses/harvests/sales, and watch the **Profit/Loss** dashboard update.
3. Create a marketplace listing, then register a **Buyer** in a second browser to search produce, place an order, and see the farmer accept it — with notifications created at each step.
4. Explore **Market Prices** (current + per-market price history) and the **Guides** section.



---


## License

See [`mobile/LICENSE`](mobile/LICENSE) (MIT).