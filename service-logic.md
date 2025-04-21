# Services Documentation (`src/services/`)

This document provides an overview of the services defined in the `src/services/` directory. Services contain reusable business logic and helper functions consumed by route handlers and other parts of the application.

---

### `access.ts`

*   **Purpose:** Defines user roles available in the application.
*   **Key Exports:**
    *   `roles`: A `const` object mapping role names (e.g., `ADMIN`) to their string values. This provides type safety and autocompletion.
    *   `Roles`: A TypeScript type derived from `roles` (`keyof typeof roles`), representing the union of all possible role strings (e.g., `'ADMIN'`).
*   **Details:** Currently defines only the `ADMIN` role.
*   **Usage:** Imported by `auth.ts` to type the `role` parameter in `assertHasRole` and compare against `user.roles`.

---

### `auth.ts`

*   **Purpose:** Provides the core authentication context management for incoming requests.
*   **Key Exports:**
    *   `makeAuthContext(manager: EntityManager, req: FastifyRequest)`: A factory function called for each request by the `handle` service. It returns an authentication context object specific to that request.
*   **Context Object Methods/Properties:**
    *   `getSessionId(): string | null`: Parses the `Authorization: Bearer <token>` header from `req.headers`. Verifies the token format and uses `verifySessionToken` from `session.ts` to validate the JWT. Returns the session ID (`sid`) from the token payload or `null`. Throws `StatusError(400)` for invalid header format or token.
    *   `async getSession(): Promise<Session | null>`: Retrieves the full session details. Calls `getSessionId()` first. If an ID exists, it calls `getSessionAndBump` from `session.ts` using a forked `EntityManager`. Caches the result within the request context (`sessionCache`). Returns the `Session` object or `null`.
    *   `async getUser(): Promise<User | null>`: Retrieves the user associated with the session. Calls `getSession()` first. If a session exists, it fetches the `User` entity using the `session.user` ID and the forked `EntityManager`. Caches the result (`userCache`). Returns the `User` object or `null`.
    *   `async assert(): Promise<User>`: Ensures the request is authenticated. Calls `getUser()`. If no user is found (meaning no valid session/token), it throws `StatusError('Not logged in', 401)`. Otherwise, returns the authenticated `User`.
    *   `get user(): User`: Getter property that returns the cached user (`userCache`). Throws a runtime error if accessed before `assert()` has been successfully called.
    *   `get session(): Session`: Getter property that returns the cached session (`sessionCache`). Throws a runtime error if accessed before `assert()` has been successfully called.
    *   `async assertHasRole(role: Roles): Promise<void>`: Checks if the authenticated user has a specific role. Calls `assert()` first to ensure authentication. Checks if the `user.roles` array includes the specified `role` (defined in `access.ts`). Throws `StatusError('No permissions', 403)` if the role is missing.
*   **Details:** Uses a request-scoped fork of the `EntityManager` (`manager.fork()`) for database operations to ensure isolation. Implements per-request caching for user and session data to avoid redundant database lookups within the same request lifecycle.
*   **Usage:** Called by `handler.ts` to create `ctx.auth`, which is then used within route handlers to manage authentication and authorization.

---

### `captcha.ts`

*   **Purpose:** Handles server-side verification of CAPTCHA tokens (e.g., hCaptcha).
*   **Key Exports:**
    *   `async assertCaptcha(token?: string): Promise<void>`: Verifies a CAPTCHA token.
*   **Logic:**
    1.  Checks if CAPTCHA is enabled via `conf.captcha.enabled`.
    2.  If enabled, checks if a `token` was provided. Throws `StatusError('Captcha token missing', 400)` if not.
    3.  Sends a POST request to the CAPTCHA provider's verification endpoint (`conf.captcha.verificationUrl`) with the `secret=` key (`conf.captcha.secretKey`) and the client's `response=` token.
    4.  Parses the JSON response. Throws `StatusError('Captcha verification failed', 400)` if the request fails, the response is invalid, or the `success` field in the response is `false`.
*   **Configuration:** Relies on `conf.captcha.enabled`, `conf.captcha.verificationUrl`, and `conf.captcha.secretKey`.
*   **Usage:** Called by public endpoints susceptible to bots, like `/auth/register/start`, before performing sensitive operations.

---

### `challenge.ts`

*   **Purpose:** Manages the creation and verification of single-use challenge codes used in the public-key authentication flow.
*   **Key Exports:**
    *   `async assertChallengeCode(em: EntityManager, code: string, publicKey: string, signature: string, flow: 'login' | 'registration', authType: 'mnemonic'): Promise<void>`: Verifies a submitted challenge.
*   **Logic (`assertChallengeCode`):**
    1.  Finds the `ChallengeCode` entity in the database using the provided `code`.
    2.  Throws `StatusError('Invalid challenge code', 400)` if the code is not found.
    3.  Checks if the code has expired (`expiresAt`). Throws `StatusError('Challenge code expired', 400)` if expired.
    4.  Checks if the `flow` and `authType` match the parameters. Throws `StatusError('Invalid challenge code', 400)` if mismatched.
    5.  Verifies the cryptographic `signature` against the `publicKey` and the challenge `code` using the `tweetnacl` library (`nacl.sign.detached.verify`). Throws `StatusError('Invalid signature', 400)` if verification fails.
    6.  If all checks pass, removes the used `ChallengeCode` entity from the database (`em.removeAndFlush`).
*   **Database Interaction:** Reads and deletes `ChallengeCode` entities.
*   **Usage:** Called by the `/auth/login/complete` and `/auth/register/complete` endpoints to validate the client's response to the challenge initiated by the `/auth/.../start` endpoints.

---

### `error.ts`

*   **Purpose:** Defines a custom error class for consistent HTTP error handling across the application.
*   **Key Exports:**
    *   `StatusError`: Extends the built-in `Error` class. Takes a `message` (string) and a `status` (number) in its constructor. The `status` property holds the intended HTTP status code associated with the error.
*   **Usage:** Instantiated and thrown throughout route handlers and services when a specific HTTP error response is desired (e.g., `throw new StatusError('Not Found', 404)`). Fastify likely has error handling middleware that catches these and formats the HTTP response accordingly.

---

### `handler.ts`

*   **Purpose:** Provides a crucial wrapper for route handler functions to standardize context injection, database transaction scoping, and error handling.
*   **Key Exports:**
    *   `handle(handlerFn)`: A higher-order function that accepts the user-defined route logic (`handlerFn`). It returns a standard Fastify `RouteHandlerMethod`.
    *   `RequestContext<...>`: A TypeScript type defining the structure of the context object passed to `handlerFn`.
*   **Logic:**
    1.  When a request hits an endpoint using `handle`, the returned Fastify handler is invoked.
    2.  It gets the global MikroORM instance (`getORM()`) and creates a request-specific `EntityManager` using `em.fork()`. This ensures that database operations within a single request are isolated and transactional.
    3.  It creates the `RequestContext` object (`ctx`), populating it with:
        *   `req`, `res`: The raw Fastify request and reply objects.
        *   `body`, `params`, `query`: Convenient access to parsed request data.
        *   `em`: The forked `EntityManager` for database operations within this request.
        *   `auth`: The authentication context object generated by `makeAuthContext(em, req)`.
        *   `limiter`: The rate limiter instance obtained from `getLimiter()`, or `null` if rate limiting is disabled.
    4.  It calls the original `handlerFn` passed to `handle`, providing the `ctx` object.
    5.  It takes the return value from `handlerFn` and sends it as the response using `res.send()`.
    6.  (Implicitly) Handles errors thrown by `handlerFn`, likely allowing Fastify's default error handling (which might look for `StatusError`) to take over.
*   **Usage:** Almost universally wraps the functions passed to `app.get`, `app.post`, etc., within routes defined using `makeRouter`.

---

### `ip.ts`

*   **Purpose:** Provides a utility function to reliably determine the client's real IP address, especially when operating behind a reverse proxy like Cloudflare.
*   **Key Exports:**
    *   `getIp(req: { ip: string; headers: IncomingHttpHeaders }): string`: Takes an object containing the request's apparent IP (`req.ip`) and its headers.
*   **Logic:**
    1.  Checks the `conf.server.trustCloudflare` configuration flag.
    2.  If true, it attempts to read the `cf-connecting-ip` HTTP header.
    3.  If the header exists (and Cloudflare is trusted), its value is returned as the client's IP.
    4.  Otherwise (Cloudflare not trusted, or header missing), it returns the original `req.ip` provided by the framework.
*   **Configuration:** Depends on `conf.server.trustCloudflare`.
*   **Usage:** Intended for use by components that need the true client IP, such as rate limiting or detailed logging, to prevent bypassing limits by connecting directly instead of through the trusted proxy.

---

### `logger.ts`

*   **Purpose:** Configures and provides instances of the Winston logger for application-wide logging.
*   **Key Exports:**
    *   `log`: The primary pre-configured Winston logger instance.
    *   `scopedLogger(service: string, meta?: object)`: Creates and returns a child logger instance with default metadata including the specified `service` name and any additional `meta` provided.
    *   `makeFastifyLogger(logger: winston.Logger)`: Modifies a Winston logger instance to format Fastify's standard request log messages into a more readable format (e.g., `[STATUS] METHOD /url - time ms`), and filters out specific paths like `/healthcheck` and `/metrics`.
*   **Logic:**
    *   Uses `winston` library for logging.
    *   Configures log levels (including custom `fatal`, `warn`, `trace`).
    *   Sets up different formatting based on `conf.logging.format`: uses human-readable console format (`winston-console-format`) by default, switches to JSON format if `conf.logging.format === 'json'` (typically for production environments).
    *   Includes default metadata (`svc: 'mw-backend'`).
    *   Transports logs only to the console (`winston.transports.Console`).
*   **Configuration:** Depends on `conf.logging.format`.
*   **Usage:** The `log` instance is imported and used directly for general logging. `scopedLogger` is used to create context-specific loggers (e.g., for different modules). `makeFastifyLogger` is likely used during Fastify setup to integrate this logger with Fastify's built-in request logging.

---

### `router.ts`

*   **Purpose:** Provides a helper utility (`makeRouter`) to simplify the creation of modular Fastify route definitions, ensuring consistent typing and plugin structure.
*   **Key Exports:**
    *   `Instance`: A type alias for the Fastify instance, pre-configured with the `ZodTypeProvider` for schema validation.
    *   `RegisterPlugin`: A type alias for the async plugin function expected by Fastify's `register` method.
    *   `makeRouter(cb: (app: Instance) => void): { register: RegisterPlugin }`: A factory function.
*   **Logic (`makeRouter`):**
    1.  Accepts a callback function (`cb`) as an argument.
    2.  The callback function `cb` receives the correctly typed Fastify `Instance` (`app`) as its parameter.
    3.  Inside the callback, the user defines routes using `app.get`, `app.post`, etc., leveraging the built-in Zod schema validation provided by `ZodTypeProvider`.
    4.  `makeRouter` returns an object `{ register: async (app) => { cb(app); } }`.
    5.  The `register` function is an async Fastify plugin that, when registered with the main Fastify application, executes the user's callback (`cb`), effectively attaching the defined routes to the Fastify instance.
*   **Usage:** Used in each file within `src/routes/` (e.g., `src/routes/meta.ts`, `src/routes/auth/login.ts`) to define the routes for that module. The exported `register` function is then likely used in `src/main.ts` or `src/modules/fastify/setup.ts` to register all these route modules with the main Fastify application.

---

### `session.ts`

*   **Purpose:** Handles the technical aspects of user session management, including creation, persistence, JWT handling, and expiry.
*   **Key Exports:**
    *   `async getSession(em: EntityManager, id: string): Promise<Session | null>`: Finds a `Session` entity by its `id` using the provided `EntityManager`. Returns `null` if not found or if `session.expiresAt` is in the past.
    *   `async getSessionAndBump(em: EntityManager, id: string): Promise<Session | null>`: Calls `getSession`. If a valid session is found, it updates the session's `accessedAt` to the current time and extends `expiresAt` by `SESSION_EXPIRY_MS` (21 days). It then persists these changes using `em.persistAndFlush` before returning the updated session.
    *   `makeSession(user: string, device: string, userAgent?: string): Session`: Creates a new, unsaved `Session` entity instance. Initializes `createdAt`, `accessedAt`, and `expiresAt` (current time + `SESSION_EXPIRY_MS`). Requires `userAgent`. Sets the `user` (user ID) and `device` properties.
    *   `makeSessionToken(session: Session): string`: Generates a JWT. Uses the `jsonwebtoken` library (`sign`) to create a token with the payload `{ sid: session.id }`. Signs it using the HS256 algorithm and the secret key from `conf.crypto.sessionSecret`.
    *   `verifySessionToken(token: string): { sid: string } | null`: Verifies a JWT. Uses `jsonwebtoken` (`verify`) with the configured secret and HS256 algorithm. Returns the decoded payload (`{ sid: string }`) if valid, otherwise returns `null` (e.g., if signature is invalid or an error occurs).
*   **Database Interaction:** Creates (`makeSession` + persist), reads (`getSession`, `getSessionAndBump`), and updates (`getSessionAndBump`) `Session` entities.
*   **Configuration:** Depends on `conf.crypto.sessionSecret` for JWT signing/verification.
*   **Usage:** Central to the authentication system. Used by `auth.ts` to verify incoming tokens and fetch session/user data. Used by login/registration routes (`/auth/.../complete`) via `makeSession` and `makeSessionToken` to establish new user sessions.