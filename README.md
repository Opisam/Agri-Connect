# AgriConnect Uganda

Digital agricultural platform helping Ugandan farmers manage farms, understand finances, connect with buyers, and access market information.

## Repository structure

```
.
├── backend/    # Django + Django REST Framework (PostgreSQL)
├── web/        # React + TypeScript (Vite)
├── mobile/     # React Native + TypeScript (Expo)
└── .github/    # GitHub Actions CI/CD workflows
```

## Branch strategy

- `main` — production-ready code. Merges only through reviewed PRs with passing checks.
- `dev` — integration branch for ongoing development. Feature branches merge here first, then PRs promote `dev` → `main`.

All PRs targeting `main` or `dev` are validated by GitHub Actions.

## CI/CD (GitHub Actions)

| Workflow  | Checks |
|-----------|--------|
| `backend.yml` | ruff lint, Django system check, pytest against PostgreSQL 16 |
| `web.yml`     | oxlint, TypeScript typecheck, vitest, production build |
| `mobile.yml`  | TypeScript typecheck, jest tests, Expo config validation |

Workflows run on:
- Push to `dev` or `main`
- Pull requests targeting `dev` or `main`

A PR cannot be merged into `main` if any required checks fail (enforce via branch protection rules in GitHub Settings → Branches).

## Backend setup (local)

Requires Python 3.13+.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env   # then edit values
python manage.py migrate
python manage.py runserver
```

- API base URL: `http://localhost:8000/api/v1/`
- Admin: `http://localhost:8000/admin/`

PostgreSQL is the primary database. For local dev without PostgreSQL, the default `.env` uses SQLite (`DATABASE_URL=sqlite:///db.sqlite3`).

### Lint & test

```powershell
ruff check apps config
pytest
```

## Web setup (local)

```powershell
cd web
npm install
npm run dev
```

- Dev server: `http://localhost:5173` (proxies `/api` → `http://localhost:8000`)
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`

## Mobile setup (local)

```powershell
cd mobile
npm install
npm start
```

- `npm run typecheck`, `npm run test`
- Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to your machine's LAN IP for device testing.

## Documentation

- Project specification: [prd.md](prd.md)

## License

See [LICENSE](mobile/LICENSE).