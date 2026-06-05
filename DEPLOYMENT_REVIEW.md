# Deployment Review — Making It Production-Ready

## Current State

The project ships with a reasonable dev-oriented Docker setup:

| File | What it does | Issues |
|------|-------------|--------|
| `docker-compose.yml` | Runs Postgres, RabbitMQ, MailHog, and the backend | **No frontend container** — the React app must be run separately with `npm run dev` |
| `backend/Dockerfile` | Multi-stage build (JDK → JRE Alpine) | Port mismatch: `EXPOSE 8081` but the JAR actually listens on `8080` (see `application.yml`); the compose file then maps `8081:8080` which works, but the Dockerfile's `EXPOSE` is misleading |
| `.env` / `.env.example` | Environment variables for compose | `.env` is committed to git with real passwords (`pass123`); `.env.example` also contains a JWT secret — both are security risks |
| `ci.yml` | Builds + tests backend and lints + builds frontend | No deployment step; CI and CD are separate worlds |

**Bottom line:** running the full stack today requires `docker compose up` for infrastructure + backend, then `cd frontend && npm run dev` in a separate terminal. There is no single command that gives you a complete, working application.

---

## Problem 1 — The Frontend Has No Container

The frontend build produces a static `dist/` directory (Vite + React), but there is no `Dockerfile` or compose service for it. In production you'd need to manually copy the built files somewhere and configure a web server.

### Recommendation: Add a frontend Nginx container

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

With a minimal `nginx.conf` that reverse-proxies `/v1/*` to the backend:

```nginx
# frontend/nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /v1/ {
        proxy_pass http://backend:8080/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

This eliminates the Vite dev proxy entirely in production and means the frontend talks to the backend over Docker's internal network — no CORS issues, no exposed backend port.

---

## Problem 2 — No Health Checks in Compose

The backend `depends_on: [db, rabbitmq, mailhog]` only waits for the containers to *start*, not for them to be *ready*. On a slow machine the backend boots before Postgres is accepting connections and crashes. The `restart: on-failure` policy masks this with retry loops.

### Recommendation: Add health checks

```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5
    # ...

  rabbitmq:
    image: rabbitmq:3-management-alpine
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 10s
      timeout: 5s
      retries: 5
    # ...

  backend:
    depends_on:
      db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    # ...
```

The CI workflow already does this with `--health-cmd pg_isready` for Postgres — the compose file should mirror it.

---

## Problem 3 — Secrets Committed to Git

The `.env` file is tracked in git and contains `pass123` as the database password. The `.env.example` contains a hardcoded JWT secret. In `application.yml`, the same JWT secret appears as a fallback default.

### Recommendation

1. **Add `.env` to `.gitignore`** immediately. It should never be version-controlled.
2. **Remove the fallback JWT secret** from `application.yml` — if `JWT_SECRET` is unset, the app should fail to start rather than silently using a published default.
3. For production, use Docker Secrets or an external secrets manager. For the dev workflow, `.env.example` with placeholder values is fine — developers copy it to `.env` and fill in real values.

---

## Problem 4 — Backend Dockerfile Port Confusion

The Dockerfile contains:

```dockerfile
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=8081"]
```

But `application.yml` sets `server.port: 8080`, and the compose file maps `8081:8080`. The `--server.port=8081` in the Dockerfile overrides the YAML when run standalone but conflicts with the compose mapping.

### Recommendation

Let `application.yml` be the single source of truth. Remove the port override from the Dockerfile:

```dockerfile
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Keep the compose mapping as `"8081:8080"` if you want the host-side port to differ.

---

## Problem 5 — MailHog is a Dev-Only Tool in the Production Stack

MailHog is a fake SMTP server for development. It should **not** be present in a production compose file. The backend's `application.yml` has `smtp.auth: false` and `starttls.enable: false` hardcoded.

### Recommendation: Use Spring profiles

Create `application-prod.yml` that overrides mail settings with real SMTP credentials, and start the backend with `SPRING_PROFILES_ACTIVE=prod`. In the compose file, split into `docker-compose.yml` (production) and `docker-compose.override.yml` (dev extras like MailHog and exposed debug ports).

---

## Problem 6 — No Single-Command Full Stack

### Recommendation: Revised `docker-compose.yml`

Here is what a cleaner, complete compose file would look like:

```yaml
services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_DEFAULT_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DB_HOST: db
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_DEFAULT_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS}
      MAIL_HOST: ${MAIL_HOST:-mailhog}
      MAIL_PORT: ${MAIL_PORT:-1025}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    # No host port exposed — Nginx handles routing

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  rabbitmq_data:
```

```yaml
# docker-compose.override.yml  (loaded automatically in dev)
services:
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

  db:
    ports:
      - "5432:5432"    # expose for local DBeaver/pgAdmin

  rabbitmq:
    ports:
      - "5672:5672"
      - "15672:15672"  # management UI

  backend:
    ports:
      - "8081:8080"    # direct backend access for Swagger/debugging
```

With this setup:
- `docker compose up` in dev → gets everything including MailHog, exposed ports, the works.
- `docker compose -f docker-compose.yml up` in production → only the essentials, frontend on port 80, no MailHog, no leaked database ports.

---

## Problem 7 — CI Doesn't Build or Push Images

The CI workflow tests the code but never builds a Docker image or deploys it anywhere. This means every deployment is a manual `git pull` + `docker compose build` on the server.

### Recommendation: Add a CD step

```yaml
# Append to ci.yml
  deploy:
    needs: [backend, frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:latest
```

This builds both images on every merge to `main` and pushes them to the free GitHub Container Registry. On the server, you replace the `build:` directives in compose with `image: ghcr.io/.../backend:latest` and just run `docker compose pull && docker compose up -d`.

---

## Summary — Effort vs. Impact

| Change | Effort | Impact |
|--------|--------|--------|
| Add `frontend/Dockerfile` + Nginx | ~30 min | ⬆⬆⬆ Single-command full stack |
| Health checks in compose | ~10 min | ⬆⬆ Eliminates boot race conditions |
| Remove `.env` from git | ~5 min | ⬆⬆⬆ Security fix |
| Fix Dockerfile port | ~2 min | ⬆ Eliminates confusion |
| Dev/prod compose split | ~15 min | ⬆⬆ No MailHog in production |
| Spring profiles for mail | ~15 min | ⬆⬆ Real email in production |
| CI/CD image push | ~20 min | ⬆⬆⬆ Automated deployments |
| Remove JWT fallback | ~2 min | ⬆⬆ Security fix |
