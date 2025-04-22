# Database

This section provides details about the database setup, schema management, and migrations.

## ORM and Connection

*   **ORM**: The backend uses [Drizzle ORM](https://orm.drizzle.team/) for database interactions.
*   **Dialect**: PostgreSQL
*   **Driver**: `pg` (node-postgres)
*   **Connection**: A connection is established using the `pg.Client` based on the `DATABASE_URL` environment variable. The connection details are specified in the `apps/backend/.env` file (for development) or environment variables (for production).
*   **Setup**: The Drizzle instance (`db`) is initialized in `apps/backend/src/db.ts` by passing the connected `pg.Client` and the combined schema.

## Schema

*   The database schema is defined using Drizzle's syntax in `apps/backend/src/schemas/index.ts`.
*   This file defines all the tables (`users`, `contents`, `chapters`, `comments`, etc.) and their relationships (`relations`).
*   Refer to the [API Documentation Data Models](./../api/README.md#data-models) section for a summary of the main tables and fields.

## Migrations

*   **Tool**: Database schema migrations are managed using [Drizzle Kit](https://orm.drizzle.team/kit/overview).
*   **Configuration**: Migration settings are defined in `apps/backend/drizzle.config.ts`.
    *   `schema`: Points to the schema definition file (`./src/schemas/index.ts`).
    *   `out`: Specifies the output directory for migration files (`./src/schemas/migrations`).
*   **Generating Migrations**: When schema changes are made in `src/schemas/index.ts`, new migration files can be generated using the Drizzle Kit CLI command:
    ```bash
    # From the workspace root
    npm run db:generate --workspace=backend
    # Or from apps/backend directory
    # npx drizzle-kit generate
    ```
*   **Applying Migrations**: Migrations are automatically applied when the server starts up. The `migrate` function from `drizzle-orm/postgres-js/migrator` is called in `apps/backend/src/server.ts` during the `startFastify` process, using the configured migrations folder (`config.paths.migrations`).

## Seeding Data

*   *(Information about data seeding procedures, if any, should be added here. Currently, no specific seeding script is apparent in the project structure.)*

## Backup and Restore

*   *(Procedures for backing up and restoring the PostgreSQL database should be documented here. This typically involves using standard PostgreSQL tools like `pg_dump` and `pg_restore`.)* 