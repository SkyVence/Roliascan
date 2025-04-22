# Configuration

The backend configuration is managed primarily through environment variables. These variables control database connections, server settings, authentication secrets, file upload behavior, and more.

## Loading Configuration

Environment variables are loaded using the `dotenv` package from an `.env` file located in the `apps/backend` directory. This is primarily for development.

In production environments, these variables should be set directly in the deployment environment (e.g., system environment variables, Docker environment variables, serverless function settings).

The loaded variables are validated against a Zod schema defined in `apps/backend/src/config/env.ts`. If any required variables are missing or invalid, the server will fail to start.

The validated environment variables are then structured and exported from `apps/backend/src/config/index.ts`, which also computes some path configurations and defines default role permissions.

## Environment Variables

The following environment variables are used:

| Variable             | Description                                                                 | Required | Default        | Example                                        |
| -------------------- | --------------------------------------------------------------------------- | -------- | -------------- | ---------------------------------------------- |
| `NODE_ENV`           | Application environment                                                     | No       | `development`  | `production`                                   |
| `PORT`               | The port the server listens on                                              | No       | `3000`         | `8080`                                         |
| `HOST`               | The host interface the server binds to                                      | No       | `0.0.0.0`      | `127.0.0.1`                                    |
| `JWT_SECRET`         | Secret key used for signing JSON Web Tokens                                 | **Yes**  | -              | `a_very_long_and_secure_random_string`         |
| `JWT_EXPIRES_IN`     | Expiry time for JWTs (e.g., `7d`, `1h`, `30m`)                            | No       | `7d`           | `24h`                                          |
| `DATABASE_URL`       | PostgreSQL connection string                                                | **Yes**  | -              | `postgresql://user:password@host:port/dbname` |
| `UPLOAD_DIR`         | Directory for local uploads (relative to backend root)                      | No       | `uploads`      | `data/media`                                   |
| `MAX_FILE_SIZE`      | Maximum file upload size in bytes                                           | No       | `10485760` (10MB) | `20971520` (20MB)                             |
| `UPLOAD_METHOD`      | Upload storage method (`server` for local, `cdn` for UploadThing)         | No       | `server`       | `cdn`                                          |
| `UPLOADTHING_SECRET` | API key for UploadThing (required if `UPLOAD_METHOD="cdn"`)               | **If CDN** | -              | `ut_secret_*************************`          |
| `UPLOADTHING_APP_ID` | App ID for UploadThing (required if `UPLOAD_METHOD="cdn"`)                | **If CDN** | -              | `ut_app_***************************`           |

## Default Role Permissions

The configuration file (`src/config/index.ts`) also defines a baseline set of permissions granted to each role:

*   **`admin`**: `["*" ]` (All permissions)
*   **`moderator`**: `["create:content", "update:content", "create:chapter", "update:chapter", "delete:comment", "mute:user"]`
*   **`uploader`**: `["create:content", "update:content", "create:chapter", "update:chapter"]`
*   **`user`**: `[]` (No special permissions by default)

Additional specific permissions can be granted to users via the `/admin/users/:id/permissions` endpoint. 