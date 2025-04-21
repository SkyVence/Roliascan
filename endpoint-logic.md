# Endpoint and Function Logic

This document details the logic for API endpoints and key functions/services within the project.

## Core Concepts

*   **Routing:** Routes are defined in `src/routes/` using the `makeRouter` service (`src/services/router.ts`). This service creates Fastify plugins that group related endpoints.
*   **Handler Wrapper (`handle`):** Most route logic is wrapped by the `handle` function (`src/services/handler.ts`). This wrapper provides each request with:
    *   A forked MikroORM `EntityManager` (`ctx.em`) for isolated database operations.
    *   Easy access to request (`ctx.req`), reply (`ctx.res`), body (`ctx.body`), params (`ctx.params`), and query (`ctx.query`).
    *   An authentication context (`ctx.auth`) created by `makeAuthContext` (`src/services/auth.ts`).
    *   Access to the rate limiter (`ctx.limiter`) from `getLimiter` (`src/modules/ratelimits/index.ts`).
*   **Services (`src/services/`):** Contain reusable business logic invoked by route handlers.
*   **Modules (`src/modules/`):** Encapsulate setup and configuration for core functionalities (Fastify, MikroORM, Metrics, Jobs, Rate Limiting).

## Endpoints

### Root (`src/routes/index.ts`)

*   **`GET /`**
    *   **Purpose:** Simple check to confirm the backend is running.
    *   **Logic:** Returns a JSON object with a message indicating the backend is working and its version.
    *   **Services Used:** `handle`.
    *   **Authentication:** None.

### Meta (`src/routes/meta.ts`)

*   **`GET /healthcheck`**
    *   **Purpose:** Performs a health check, primarily verifying database connectivity.
    *   **Logic:** Uses the `EntityManager` (`ctx.em`) provided by `handle` to check if the database driver connection is active. Returns a status indicating overall health and database connection status. Sets HTTP status to 503 if unhealthy.
    *   **Services Used:** `handle`.
    *   **Authentication:** None.

*   **`GET /meta`**
    *   **Purpose:** Provides frontend clients with basic metadata about the backend instance.
    *   **Logic:** Returns configuration values such as the instance name, description, version, whether CAPTCHA is enabled, and the CAPTCHA client key.
    *   **Services Used:** `handle`.
    *   **Authentication:** None.

### Metrics (`src/routes/metrics.ts`)

*   **`POST /metrics/providers`**
    *   **Purpose:** Allows clients (likely the frontend) to report metrics about video provider loading attempts and outcomes.
    *   **Input Body:** An array `items`, each containing details about a provider attempt (TMDB ID, type, title, season/episode, status, provider ID, embed ID, error messages). Also accepts an optional `tool` string.
    *   **Logic:**
        1.  Asserts rate limits using `ctx.limiter` (ID: `provider_metrics`).
        2.  Increments Prometheus counters (`getMetrics()` from `src/modules/metrics`):
            *   `providerHostnames`: Tracks hostnames making requests.
            *   `providerStatuses`: Tracks success/failure counts per provider.
            *   `watchMetrics`: Tracks watch attempts, linking TMDB ID, provider, title, and success status.
            *   `toolMetrics`: Tracks usage of associated tools (if `tool` is provided).
    *   **Services Used:** `handle`, `getMetrics`.
    *   **Authentication:** None (relies on rate limiting).

*   **`POST /metrics/captcha`**
    *   **Purpose:** Allows clients to report the success or failure of CAPTCHA solves.
    *   **Input Body:** A boolean `success` field.
    *   **Logic:**
        1.  Asserts rate limits using `ctx.limiter` (ID: `captcha_solves`).
        2.  Increments the `captchaSolves` Prometheus counter (`getMetrics()`), tagged with success status.
    *   **Services Used:** `handle`, `getMetrics`.
    *   **Authentication:** None (relies on rate limiting).

---
*Documentation will be expanded as more routes and services are analyzed.* 
### Authentication (`src/routes/auth/`)

These endpoints handle user registration, login, and session management using a public-key challenge-response mechanism.

#### Registration (`src/routes/auth/manage.ts`)

*   **`POST /auth/register/start`**
    *   **Purpose:** Initiates the user registration flow by generating a challenge.
    *   **Input Body:** Optional `captchaToken`.
    *   **Logic:**
        1.  Asserts rate limits (ID: `register_challenge_tokens`).
        2.  Verifies the CAPTCHA token using `assertCaptcha` (`src/services/captcha.ts`).
        3.  Creates and persists a `ChallengeCode` entity with `flow='registration'`, `authType='mnemonic'`.
        4.  Returns the generated challenge code.
    *   **Services Used:** `handle`, `limiter.assertAndBump`, `assertCaptcha`, `ChallengeCode` entity.
    *   **Authentication:** None (relies on rate limiting and CAPTCHA).

*   **`POST /auth/register/complete`**
    *   **Purpose:** Completes the user registration using the challenge response.
    *   **Input Body:** `publicKey`, `challenge` (code + signature), `namespace`, `device` info, `profile` details (colors, icon).
    *   **Logic:**
        1.  Asserts rate limits (ID: `register_complete`).
        2.  Verifies the challenge signature against the public key and stored code using `assertChallengeCode` (`src/services/challenge.ts`, requires `flow='registration'`, `authType='mnemonic'`).
        3.  Creates a new `User` entity with the provided details (namespace, publicKey, profile).
        4.  Creates a new `Session` entity for the user using `makeSession` (`src/services/session.ts`), linking the user ID and device info.
        5.  Persists the new user and session.
        6.  Increments the `user` Prometheus counter (`getMetrics()`).
        7.  Generates a JWT session token using `makeSessionToken` (`src/services/session.ts`).
        8.  Returns the formatted user, formatted session, and the JWT session token.
    *   **Services Used:** `handle`, `limiter.assertAndBump`, `assertChallengeCode`, `User` entity, `Session` entity, `makeSession`, `makeSessionToken`, `getMetrics`, `formatUser`, `formatSession`.
    *   **Authentication:** Implicitly via challenge response.

#### Login (`src/routes/auth/login.ts`)

*   **`POST /auth/login/start`**
    *   **Purpose:** Initiates the user login flow by generating a challenge.
    *   **Input Body:** `publicKey`.
    *   **Logic:**
        1.  Asserts rate limits (ID: `login_challenge_tokens`).
        2.  Finds the `User` associated with the `publicKey`. Throws 401 if not found.
        3.  Creates and persists a `ChallengeCode` entity with `flow='login'`, `authType='mnemonic'`.
        4.  Returns the generated challenge code.
    *   **Services Used:** `handle`, `limiter.assertAndBump`, `User` entity, `ChallengeCode` entity.
    *   **Authentication:** None (relies on rate limiting).

*   **`POST /auth/login/complete`**
    *   **Purpose:** Completes the user login using the challenge response.
    *   **Input Body:** `publicKey`, `challenge` (code + signature), `device` info.
    *   **Logic:**
        1.  Asserts rate limits (ID: `login_complete`).
        2.  Verifies the challenge signature against the public key and stored code using `assertChallengeCode` (`src/services/challenge.ts`, requires `flow='login'`, `authType='mnemonic'`).
        3.  Finds the `User` associated with the `publicKey`. Throws 401 if not found.
        4.  Updates the user's `lastLoggedIn` timestamp.
        5.  Creates a new `Session` entity for the user using `makeSession`.
        6.  Persists the updated user and new session.
        7.  Generates a JWT session token using `makeSessionToken`.
        8.  Returns the formatted user, formatted session, and the JWT session token.
    *   **Services Used:** `handle`, `limiter.assertAndBump`, `assertChallengeCode`, `User` entity, `Session` entity, `makeSession`, `makeSessionToken`, `formatUser`, `formatSession`.
    *   **Authentication:** Implicitly via challenge response.

#### Session Management (`src/routes/auth/session.ts`)

*   **`DELETE /sessions/:sid`**
    *   **Purpose:** Deletes a specific user session (logout).
    *   **URL Params:** `sid` (Session ID).
    *   **Logic:**
        1.  Asserts the user is authenticated using `ctx.auth.assert()`.
        2.  Finds the `Session` entity by the provided `sid`.
        3.  Verifies that the authenticated user (`ctx.auth.user.id`) owns the session. Throws 401 if not.
        4.  Removes and flushes the `Session` entity.
        5.  Returns the ID of the deleted session.
    *   **Services Used:** `handle`, `auth.assert()`, `Session` entity.
    *   **Authentication:** Required (Bearer Token).

---
*Documentation will be expanded as more routes and services are analyzed.* 
### Sessions (`src/routes/sessions/sessions.ts`)

*   **`PATCH /sessions/:sid`**
    *   **Purpose:** Updates details of a specific user session, currently only the device name.
    *   **URL Params:** `sid` (Session ID).
    *   **Input Body:** Optional `deviceName`.
    *   **Logic:**
        1.  Asserts the user is authenticated using `ctx.auth.assert()`.
        2.  Finds the `Session` entity by the provided `sid`. Throws 404 if not found.
        3.  Verifies that the `sid` from the URL matches the found session's ID (this check seems redundant given the `findOne` query). Throws 401 if not.
        4.  If `deviceName` is provided in the body, updates the session's `device` property.
        5.  Persists the updated session.
        6.  Returns the formatted updated session.
    *   **Services Used:** `handle`, `auth.assert()`, `Session` entity, `formatSession`.
    *   **Authentication:** Required (Bearer Token).

---
*Documentation will be expanded as more routes and services are analyzed.* 
### User Data (`src/routes/users/`)

These endpoints manage user-specific data like profiles, sessions, settings, bookmarks, and watch progress. All endpoints require authentication and verify that the authenticated user matches the `:uid` parameter in the route.

#### User Profile & Account (`get.ts`, `edit.ts`, `delete.ts`)

*   **`GET /users/@me`**
    *   **Purpose:** Retrieves the currently authenticated user's details along with their current session information.
    *   **Logic:** Asserts authentication, finds the user based on `auth.user.id`, gets the current session via `auth.getSession()`, and returns formatted user and session data.
    *   **Services Used:** `handle`, `auth.assert()`, `auth.getSession()`, `User` entity, `formatUser`, `formatSession`.
    *   **Authentication:** Required (Bearer Token).

*   **`GET /users/:uid`**
    *   **Purpose:** Retrieves the profile details for a specific user.
    *   **URL Params:** `uid` (User ID).
    *   **Logic:** Asserts authentication, verifies `auth.user.id === params.uid`, finds the user by ID, and returns the formatted user data.
    *   **Services Used:** `handle`, `auth.assert()`, `User` entity, `formatUser`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`PATCH /users/:uid`**
    *   **Purpose:** Updates the profile (colors, icon) for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Input Body:** Optional `profile` object (`colorA`, `colorB`, `icon`). Note: `name` is in schema but not used.
    *   **Logic:** Asserts authentication, verifies ownership (`auth.user.id === params.uid`), finds the user, updates the `profile` if provided, persists, and returns the updated formatted user.
    *   **Services Used:** `handle`, `auth.assert()`, `User` entity, `formatUser`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`DELETE /users/:uid`**
    *   **Purpose:** Deletes the authenticated user's account and all associated data.
    *   **URL Params:** `uid` (User ID).
    *   **Logic:**
        1.  Asserts authentication and verifies ownership.
        2.  Finds the user.
        3.  Deletes associated `Bookmark`, `ProgressItem`, and `UserSettings` records using `createQueryBuilder`.
        4.  Finds all associated `Session` records.
        5.  Removes the `User` record and all found `Session` records.
        6.  Flushes changes.
        7.  Returns the ID of the deleted user.
    *   **Services Used:** `handle`, `auth.assert()`, `User`, `Bookmark`, `ProgressItem`, `UserSettings`, `Session` entities.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

#### User Sessions (`sessions.ts`)

*   **`GET /users/:uid/sessions`**
    *   **Purpose:** Retrieves a list of all active sessions for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Logic:** Asserts authentication, verifies ownership, finds all `Session` entities linked to the user ID, and returns the formatted list.
    *   **Services Used:** `handle`, `auth.assert()`, `Session` entity, `formatSession`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

#### User Settings (`settings.ts`)

*   **`GET /users/:uid/settings`**
    *   **Purpose:** Retrieves the settings for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Logic:** Asserts authentication, verifies ownership, finds the `UserSettings` entity for the user ID. Returns formatted settings or just the ID if none exist.
    *   **Services Used:** `handle`, `auth.assert()`, `UserSettings` entity, `formatUserSettings`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`PUT /users/:uid/settings`**
    *   **Purpose:** Creates or updates settings for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Input Body:** Optional settings fields (`applicationLanguage`, `applicationTheme`, `defaultSubtitleLanguage`, `proxyUrls`).
    *   **Logic:** Asserts authentication, verifies ownership. Finds existing `UserSettings` or creates a new one if needed. Updates fields based on the request body, persists, and returns the formatted settings.
    *   **Services Used:** `handle`, `auth.assert()`, `UserSettings` entity, `formatUserSettings`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

#### User Bookmarks (`bookmark.ts`)

*   **`GET /users/:uid/bookmarks`**
    *   **Purpose:** Retrieves all bookmarks for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Logic:** Asserts authentication, verifies ownership, finds all `Bookmark` entities for the user, and returns the formatted list.
    *   **Services Used:** `handle`, `auth.assert()`, `Bookmark` entity, `formatBookmark`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`POST /users/:uid/bookmarks/:tmdbid`**
    *   **Purpose:** Creates a new bookmark for a specific TMDB ID.
    *   **URL Params:** `uid` (User ID), `tmdbid` (TMDB ID).
    *   **Input Body:** `meta` object for the bookmark.
    *   **Logic:** Asserts authentication, verifies ownership. Checks if a bookmark already exists for this user/TMDB ID (throws 400 if so). Creates, persists, and returns the new formatted bookmark.
    *   **Services Used:** `handle`, `auth.assert()`, `Bookmark` entity, `formatBookmark`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`PUT /users/:uid/bookmarks`**
    *   **Purpose:** Bulk creates or updates bookmarks for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Input Body:** An array of bookmark objects (`tmdbId`, `meta`).
    *   **Logic:** Asserts authentication, verifies ownership. Uses `em.upsertMany` to efficiently insert or update bookmarks based on the `userId` and `tmdbId` conflict keys. Returns the list of formatted upserted bookmarks.
    *   **Services Used:** `handle`, `auth.assert()`, `Bookmark` entity, `formatBookmark`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`DELETE /users/:uid/bookmarks/:tmdbid`**
    *   **Purpose:** Deletes a specific bookmark for the authenticated user.
    *   **URL Params:** `uid` (User ID), `tmdbid` (TMDB ID).
    *   **Logic:** Asserts authentication, verifies ownership. Finds the bookmark, removes it if found, and returns the TMDB ID.
    *   **Services Used:** `handle`, `auth.assert()`, `Bookmark` entity.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

#### User Watch Progress (`progress.ts`)

*   **`GET /users/:uid/progress`**
    *   **Purpose:** Retrieves all watch progress items for the authenticated user.
    *   **URL Params:** `uid` (User ID).
    *   **Logic:** Asserts authentication, verifies ownership, finds all `ProgressItem` entities for the user, and returns the formatted list.
    *   **Services Used:** `handle`, `auth.assert()`, `ProgressItem` entity, `formatProgressItem`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`PUT /users/:uid/progress/:tmdbid`**
    *   **Purpose:** Creates or updates the watch progress for a specific movie or episode.
    *   **URL Params:** `uid` (User ID), `tmdbid` (TMDB ID).
    *   **Input Body:** Progress details (`meta`, `duration`, `watched`, optional `seasonId`, `episodeId`, `seasonNumber`, `episodeNumber`).
    *   **Logic:** Asserts authentication, verifies ownership. Finds existing `ProgressItem` based on user, TMDB ID, season ID, and episode ID, or creates a new one. Updates `duration`, `watched`, `meta`, and `updatedAt`. Persists and returns the formatted item.
    *   **Services Used:** `handle`, `auth.assert()`, `ProgressItem` entity, `formatProgressItem`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`PUT /users/:uid/progress/import`**
    *   **Purpose:** Bulk imports watch progress items, merging intelligently with existing data.
    *   **URL Params:** `uid` (User ID).
    *   **Input Body:** An array of progress item objects.
    *   **Logic:** Asserts authentication, verifies ownership. Applies rate limiting (ID: `progress_import`). Fetches existing progress items. Iterates through the input array, merging items: if an item already exists, it updates the `watched` time only if the imported time is greater. Non-existing items are added. Uses `em.upsertMany` for efficiency. Returns the list of formatted upserted items.
    *   **Services Used:** `handle`, `auth.assert()`, `limiter.assertAndBump`, `ProgressItem` entity, `formatProgressItem`.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

*   **`DELETE /users/:uid/progress/:tmdbid`**
    *   **Purpose:** Deletes watch progress item(s) for a specific TMDB ID (and optionally season/episode).
    *   **URL Params:** `uid` (User ID), `tmdbid` (TMDB ID).
    *   **Input Body:** Optional `seasonId`, `episodeId`.
    *   **Logic:** Asserts authentication, verifies ownership. Finds `ProgressItem` entries matching the criteria. Removes found items and returns the count of deleted items along with the identifying IDs.
    *   **Services Used:** `handle`, `auth.assert()`, `ProgressItem` entity.
    *   **Authentication:** Required (Bearer Token, user must match `:uid`).

---
*End of Endpoint Documentation* 