# Docker Deployment

This document describes how to build and run the backend service using Docker and Docker Compose.

## Prerequisites

*   Docker Engine installed ([Install Docker](https://docs.docker.com/engine/install/))
*   Docker Compose installed (usually included with Docker Desktop)

## Backend Dockerfile

A `Dockerfile` is needed to containerize the backend service. Create a file named `Dockerfile` inside the `apps/backend` directory.

This example uses a multi-stage build to keep the final image small and includes steps for installing dependencies, building the TypeScript code, and setting up the runtime environment.

```Dockerfile
# apps/backend/Dockerfile

# ---- Base Stage ----
# Use a specific Node.js version known to work (e.g., Node 20 Slim)
FROM node:20-slim AS base
WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies using the workspace structure
FROM base AS deps
WORKDIR /app
# Copy root and backend package manifests
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package-lock.json* ./apps/backend/
# Install production dependencies for the backend workspace
# Using --omit=dev ensures only runtime dependencies are installed
RUN npm ci --omit=dev --workspace=backend

# ---- Builder Stage ----
# Build the TypeScript application
FROM base AS builder
WORKDIR /app
# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
# Copy the entire monorepo source code (needed for Turborepo build)
# Consider using a .dockerignore file at the root to exclude unnecessary files
COPY . .
# Build the backend application using Turborepo context if needed
RUN npm run build --workspace=backend

# ---- Runner Stage ----
# Create the final, small production image
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV production
# Set the internal port the application runs on
ENV PORT 3000

# Copy built code and necessary production dependencies from previous stages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
# Copy backend package.json (might be needed for runtime module resolution)
COPY apps/backend/package.json ./apps/backend/

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "apps/backend/dist/index.js"]

```

**Notes on the `Dockerfile`:**

*   This assumes you are using `npm`. Adjustments are needed for `pnpm` or `yarn` (e.g., using `pnpm install --prod --filter backend`).
*   A `.dockerignore` file in the workspace root is highly recommended to prevent copying unnecessary files (like `.git`, local `node_modules`, `.env` files) into the build context.
*   Environment variables like `DATABASE_URL`, `JWT_SECRET`, etc., are *not* baked into this image. They should be provided at runtime via Docker Compose or other orchestration tools.

## Running with Docker Compose

Docker Compose allows defining and running multi-container Docker applications. Create a `compose.yml` file in the **workspace root**.

### Scenario 1: Backend + PostgreSQL Database

This is common for local development or self-contained deployments. The `compose.yml` defines both the `backend` service (built from the `Dockerfile` above) and a `db` service using a standard PostgreSQL image.

```yaml
# compose.yml (in workspace root)

version: '3.8'

services:
  backend:
    build:
      context: . # Build context is the workspace root
      dockerfile: apps/backend/Dockerfile # Path to the backend Dockerfile
    ports:
      # Map host port (from .env or default 3000) to container port 3000
      - "${PORT:-3000}:3000"
    depends_on:
      - db # Ensures db starts before backend
    environment:
      NODE_ENV: production
      PORT: 3000 # Port inside the container
      DATABASE_URL: ${DATABASE_URL} # Provided from .env file
      JWT_SECRET: ${JWT_SECRET}       # Provided from .env file
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      UPLOAD_DIR: /app/uploads # Path *inside* the container
      MAX_FILE_SIZE: ${MAX_FILE_SIZE:-10485760}
      UPLOAD_METHOD: ${UPLOAD_METHOD:-server}
      # Add UPLOADTHING vars if method is 'cdn'
      # UPLOADTHING_SECRET: ${UPLOADTHING_SECRET}
      # UPLOADTHING_APP_ID: ${UPLOADTHING_APP_ID}
    volumes:
      # Mount a volume for uploads if using UPLOAD_METHOD=server
      - uploads_data:/app/uploads
    networks:
      - app_network

  db:
    image: postgres:15-alpine # Use a specific PostgreSQL version
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-roliascan}
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    volumes:
      # Persist database data
      - postgres_data:/var/lib/postgresql/data
    # Expose port only if needed for external access during development
    # ports:
    #   - "5432:5432"
    networks:
      - app_network
    # Add healthcheck for better startup coordination
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data: # Persists PostgreSQL data
  uploads_data:  # Persists uploaded files (if method=server)

networks:
  app_network:
    driver: bridge
```

**Environment File (`.env` in workspace root) for Scenario 1:**

```env
# Root .env for compose (Scenario 1)

# Backend variables
DATABASE_URL=postgresql://user:password@db:5432/roliascan # Points to 'db' service
JWT_SECRET=replace_this_with_a_very_strong_secret
PORT=3000 # Host port mapping
# UPLOAD_METHOD=server # Default

# Database variables
POSTGRES_DB=roliascan
POSTGRES_USER=user
POSTGRES_PASSWORD=password # Use a stronger password!
```

### Scenario 2: Backend Only (External Database)

Use this if your PostgreSQL database is hosted externally (e.g., managed cloud database like RDS, Cloud SQL, or another server).

```yaml
# compose.yml (in workspace root - alternative for external DB)

version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "${PORT:-3000}:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL} # Must point to the *external* DB URL
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      UPLOAD_DIR: /app/uploads
      MAX_FILE_SIZE: ${MAX_FILE_SIZE:-10485760}
      UPLOAD_METHOD: ${UPLOAD_METHOD:-server}
      # Add UPLOADTHING vars if method is 'cdn'
      # UPLOADTHING_SECRET: ${UPLOADTHING_SECRET}
      # UPLOADTHING_APP_ID: ${UPLOADTHING_APP_ID}
    volumes:
      # Still need volume if using UPLOAD_METHOD=server
      - uploads_data:/app/uploads
    networks:
      # Network needed even for single service if volumes are used
      # Or potentially connect to an external network if DB is elsewhere in Docker
      - app_network

volumes:
  uploads_data:

networks:
  app_network:
    driver: bridge
```

**Environment File (`.env` in workspace root) for Scenario 2:**

```env
# Root .env for compose (Scenario 2)

# Backend variables
DATABASE_URL=postgresql://ext_user:ext_password@your-external-db-host.com:5432/your_db_name
JWT_SECRET=replace_this_with_a_very_strong_secret
PORT=3000 # Host port mapping
# UPLOAD_METHOD=server # Default
```

## Starting and Stopping

1.  Ensure you have the correct `.env` file in the workspace root for your chosen scenario.
2.  Navigate to the workspace root directory in your terminal.
3.  **Start:** `docker compose up -d --build` (the `--build` is only needed initially or after changes to `Dockerfile` or source code)
4.  **Stop:** `docker compose down`
5.  **View Logs:** `docker compose logs -f backend` (or `docker compose logs -f db`)

## Final Notes

*   For production, always use strong, unique secrets and consider Docker Secrets or other secure methods for managing them instead of `.env` files directly on the host.
*   Ensure the `DATABASE_URL` environment variable correctly points to your database host (either the service name `db` for Scenario 1 or the external host for Scenario 2).
*   The `uploads_data` volume ensures file persistence when `UPLOAD_METHOD=server`. If using `cdn`, this volume might not be necessary for the backend container. 