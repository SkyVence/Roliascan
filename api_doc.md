# API Architecture Documentation

This document outlines the API architecture of this project and provides guidance on how to replicate it.

## Overview

The backend is a Node.js application built with TypeScript. It utilizes the [Fastify](https://www.fastify.io/) web framework for handling HTTP requests and [MikroORM](https://mikro-orm.io/) for interacting with the database (Object-Relational Mapper). The architecture emphasizes modularity and separation of concerns.

## Core Components

The `src/` directory houses the main application code, structured as follows:

*   **`main.ts`**: The main entry point of the application. It's responsible for:
    *   Bootstrapping the application.
    *   Initializing and configuring various modules (Fastify, MikroORM, Metrics, Jobs, Rate Limiting).
    *   Registering API routes.
    *   Starting the Fastify HTTP server.
*   **`modules/`**: Contains isolated modules responsible for setting up and managing core integrations and functionalities. Examples include:
    *   `fastify`: Configures the Fastify instance, including plugins and hooks.
    *   `mikro`: Sets up the MikroORM connection and provides access to the ORM instance.
    *   `metrics`: Configures Prometheus metrics collection.
    *   `jobs`: Sets up background job processing.
    *   `ratelimits`: Configures request rate limiting.
*   **`routes/`**: Defines the API endpoints. Routes are typically grouped by resource (e.g., `users`, `sessions`, `auth`). Each route file defines handlers for specific HTTP methods and paths, interacting with services to perform actions. An `index.ts` likely aggregates and exports all route definitions for registration in `main.ts`.
*   **`services/`**: Holds reusable business logic. Services encapsulate specific functionalities (e.g., user authentication, data manipulation) and are typically consumed by route handlers. This promotes code reuse and testability.
*   **`db/`**: Contains database-related files, such as:
    *   MikroORM entity definitions (mapping database tables to TypeScript classes).
    *   Database migration files (for schema evolution).
*   **`config/`**: Manages application configuration, potentially loading settings from environment variables or configuration files.
*   **`mikro-orm.config.ts`**: Specific configuration file for the MikroORM instance (database connection details, entity paths, etc.).

## Request Lifecycle (Simplified)

1.  An HTTP request arrives at the Fastify server.
2.  Fastify matches the request path/method to a defined route in `src/routes/`.
3.  Middleware (e.g., rate limiting, authentication - potentially configured in `modules/fastify` or specific routes) is executed.
4.  The corresponding route handler function is invoked.
5.  The handler calls methods on relevant services (`src/services/`) to execute business logic.
6.  Services interact with the database via MikroORM (`modules/mikro`, `db/` entities) if needed.
7.  The handler receives results from the services and constructs an HTTP response.
8.  Fastify sends the response back to the client.

## Key Technologies

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Web Framework:** Fastify
*   **ORM:** MikroORM
*   **Database:** (Not specified, but MikroORM supports PostgreSQL, MySQL, SQLite, MongoDB, etc.)
*   **Containerization:** Docker (`Dockerfile`, `dev.Dockerfile`)
*   **Linting/Formatting:** ESLint, Prettier
*   **Package Management:** npm/yarn/pnpm (`package.json`, `yarn.lock`/`pnpm-lock.yaml`)

## How to Replicate This Architecture

1.  **Choose Core Technologies:** Select your preferred Node.js framework (Fastify, Express, Koa, NestJS), ORM (MikroORM, TypeORM, Prisma, Sequelize), and database.
2.  **Project Setup:**
    *   Initialize a Node.js project (`npm init` or `yarn init`).
    *   Set up TypeScript (`tsc --init`, configure `tsconfig.json`).
    *   Install necessary dependencies (framework, ORM, TypeScript types).
    *   Set up linting and formatting (ESLint, Prettier).
3.  **Directory Structure:** Create a similar `src/` structure:
    *   `main.ts` (or `index.ts`, `app.ts`) for the entry point.
    *   `config/` for configuration management.
    *   `routes/` (or `controllers/`) for API route definitions and handlers.
    *   `services/` for business logic.
    *   `database/` or `db/` (or `entities/`, `models/`) for ORM entities and potentially migrations/repositories.
    *   `middleware/` if you need custom middleware beyond framework defaults.
    *   `modules/` or `core/` (optional) if you want to encapsulate core integrations like in this project.
4.  **Entry Point (`main.ts`):**
    *   Import necessary modules/configurations.
    *   Initialize the framework instance (e.g., `const app = fastify()`).
    *   Establish database connection (initialize ORM).
    *   Register middleware (logging, CORS, body parsing, authentication, rate limiting).
    *   Register routes (import from `routes/` and attach to the framework instance).
    *   Start the HTTP server.
5.  **Separation of Concerns:**
    *   **Routes/Controllers:** Keep handlers lightweight. Their main job is to parse requests, call services, and format responses. Avoid putting complex business logic here.
    *   **Services:** Implement the core business logic. Services should be framework-agnostic if possible (not directly dependent on request/response objects). They interact with data repositories or ORMs.
    *   **Data Access:** Use your ORM or data access layer within services to interact with the database. Define entities/models clearly.
6.  **Modularity (Optional but Recommended):** Consider encapsulating setup logic for major components (like database connection, external API clients, framework setup) into dedicated modules or functions, similar to the `src/modules/` pattern here. This improves organization, especially in larger applications.
7.  **Dependency Injection (Consider):** For larger projects, consider using a dependency injection container (like `tsyringe`, `inversifyJS`, or built-in features in frameworks like NestJS) to manage the creation and wiring of services and repositories. This improves testability and maintainability.

By following these principles – clear separation of concerns, a structured directory layout, and potentially modularizing core integrations – you can build robust and maintainable APIs similar to this project's architecture. 