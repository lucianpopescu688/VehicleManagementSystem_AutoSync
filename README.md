# Vehicle Management System

Fleet management platform built with Spring Boot, React, PostgreSQL, and RabbitMQ. Fully containerized with Docker.

## How to Run

```bash
git clone https://github.com/lucianpopescu688/VehicleManagementSystem_AutoSync.git
cd VehicleManagementSystem_AutoSync
cp .env.example .env       # then set JWT_SECRET (openssl rand -hex 32)
docker compose up --build   # starts everything on http://localhost
```

That's it. One command spins up the database, message broker, backend API, and frontend.

| Service | URL |
|---------|-----|
| App | http://localhost |
| Backend API | http://localhost:8081 |
| MailHog (dev email) | http://localhost:8025 |
| RabbitMQ management | http://localhost:15672 |

## Tech Stack

| | |
|-|-|
| **Backend** | Java 21 · Spring Boot 3 · Spring Security (JWT) · Flyway · MapStruct |
| **Frontend** | React 19 · TypeScript · TanStack Router/Query · Tailwind CSS · Vite |
| **Infra** | PostgreSQL 15 · RabbitMQ 3 · Nginx · Docker Compose |
| **CI/CD** | GitHub Actions → GitHub Container Registry |

## Project Structure

```
backend/          Spring Boot API + Dockerfile (JDK build → JRE runtime)
frontend/         React SPA + Dockerfile (Node build → Nginx runtime)
docker-compose.yml            Production stack
docker-compose.override.yml   Dev extras (MailHog, exposed DB/broker ports)
.github/workflows/ci.yml      CI/CD pipeline
```

## License

University project.
