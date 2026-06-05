# Vehicle Management System

Full-stack fleet management platform — Spring Boot API, React SPA, PostgreSQL, RabbitMQ, and MailHog for dev email.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21, Spring Boot 3, Spring Security (JWT), Flyway, MapStruct |
| **Frontend** | React 19, TypeScript, TanStack Router + Query, Tailwind CSS, Vite |
| **Database** | PostgreSQL 15 |
| **Messaging** | RabbitMQ 3 (email notifications) |
| **Email (dev)** | MailHog |
| **Containers** | Docker, Docker Compose, Nginx |
| **CI/CD** | GitHub Actions → GitHub Container Registry |

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/lucianpopescu688/VehicleManagementSystem_AutoSync.git
cd VehicleManagementSystem_AutoSync
cp .env.example .env
# Edit .env — set a real JWT_SECRET (openssl rand -hex 32)

# 2. Run the full stack
docker compose up --build
```

Open **http://localhost** — the Nginx frontend serves the React app and proxies `/v1/*` to the backend automatically.

### Dev Extras (auto-loaded)

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API (direct) | http://localhost:8081 |
| MailHog inbox | http://localhost:8025 |
| RabbitMQ management | http://localhost:15672 |
| PostgreSQL | `localhost:5432` |

### Production (no dev tools)

```bash
docker compose -f docker-compose.yml up -d
```

This skips MailHog and doesn't expose database/RabbitMQ ports to the host.

## Project Structure

```
├── backend/                  Spring Boot API
│   ├── Dockerfile            Multi-stage: JDK build → JRE runtime
│   └── src/
├── frontend/                 React SPA
│   ├── Dockerfile            Multi-stage: Node build → Nginx runtime
│   ├── nginx.conf            Reverse-proxy config
│   └── src/
├── docker-compose.yml        Production services
├── docker-compose.override.yml  Dev extras (MailHog, exposed ports)
├── .env.example              Environment variable template
└── .github/workflows/ci.yml  CI/CD pipeline
```

## CI/CD

On every push/PR to `main`:
1. **Backend** — Gradle build + tests (with Postgres & RabbitMQ service containers)
2. **Frontend** — ESLint + TypeScript build
3. **Deploy** *(main only)* — Builds Docker images and pushes to GitHub Container Registry

## API Overview

All endpoints are under `/v1/`. The backend runs on port `8080` internally; Nginx proxies requests from port `80`.

| Resource | Endpoints |
|----------|----------|
| Auth | `POST /v1/auth/register`, `POST /v1/auth/login` |
| Vehicles | CRUD at `/v1/vehicles`, paginated list, owner filter |
| Mileage | `POST /v1/mileage/log`, `GET /v1/mileage/history/{vehicleId}` |
| Consumable Parts | CRUD at `/v1/consumable-parts` |
| Legal Documents | CRUD at `/v1/legal-documents` |
| Alerts | `GET /v1/alerts/unresolved`, `PATCH /v1/alerts/{id}/resolve` |
| Appointments | CRUD + `POST /v1/appointments/{id}/complete` |
| Service Shops | `GET /v1/service-shops`, `GET /v1/service-shops/approved` |

## License

University project — not licensed for production use.
