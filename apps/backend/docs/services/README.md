# Services

The backend logic is encapsulated within various service modules located in `apps/backend/src/services`. These services handle specific domains of functionality, interact with the database (via Drizzle ORM and schemas defined in `src/schemas`), and provide reusable logic for the API routes.

## Core Services

*   **`user.ts`**: Manages user data and operations:
    *   Finding users by ID, email.
    *   Creating new users (interacts with `password.ts` for hashing).
    *   Updating user profiles (username, email, password, role, ban/mute status).
    *   Checking for existing usernames or emails.
    *   Retrieving user-specific permissions (interacts with `permission.ts`).

*   **`content.ts`**: Handles the lifecycle of content items (e.g., manga series):
    *   Creating, retrieving (by ID or slug), updating, and deleting content.
    *   Generating unique slugs for content.
    *   Fetching content lists with pagination and sorting.
    *   Aggregating related data like chapters, ratings, creator info.

*   **`chapter.ts`**: Manages chapters associated with content:
    *   Creating, retrieving, updating, and deleting chapters.
    *   Ensuring chapter number uniqueness within a content item.
    *   Fetching chapters belonging to specific content.
    *   Managing chapter images (pages), including saving metadata and retrieving the highest page number (interacts with `upload.ts` and `chapterImages` schema).

*   **`upload.ts`**: Responsible for handling file uploads:
    *   Processing multipart file streams.
    *   Validating file types (images, documents based on allowed types) and size limits (from config).
    *   Generating unique filenames/keys.
    *   Storing files (likely to configured paths like `/uploads/generic`, `/uploads/contents/:id`, `/uploads/chapters/:id` based on type).
    *   Returning metadata about the uploaded file (URL, size, type, etc.).

*   **`comment.ts`**: Handles user comments on chapters:
    *   Creating, retrieving (with pagination), updating, and deleting comments.
    *   Validating chapter existence before associating comments.
    *   Checking user mute status before allowing comment creation.

*   **`rating.ts`**: Manages user ratings for content and chapters:
    *   Creating or updating ratings (ensuring one rating per user per item).
    *   Retrieving ratings for specific items or by user.
    *   Calculating average ratings (likely done here or in `content.ts`/`chapter.ts`).

*   **`permission.ts`**: Deals with user permissions:
    *   Creating new permission types.
    *   Assigning permissions to users.
    *   Removing permissions from users.
    *   Checking if a user possesses a specific permission (used by routes/middleware).

## Utility Services

*   **`password.ts`**: Provides utility functions for:
    *   Hashing passwords securely (e.g., using bcrypt).
    *   Verifying provided passwords against stored hashes.

*   **`jwt.ts`**: Handles JSON Web Token operations:
    *   Generating JWTs for authenticated users, embedding user ID and role.
    *   (JWT verification is likely handled by the `@fastify/jwt` plugin configured in `server.ts` and the `authenticate` middleware).

## Interaction Flow (Example: Creating Content)

1.  API Route (`/content` POST in `routes/content.ts`) receives request.
2.  Route handler calls `checkPermission` (from `permission.ts`) via middleware (`fastify.authenticate` + permission check) to verify user rights.
3.  Route handler validates request body (name, author, etc.).
4.  Route handler calls `contentService.createContent`.
5.  `contentService` generates a slug, potentially checks for conflicts.
6.  `contentService` interacts with the database via Drizzle ORM (`db.insert(contents)...`) to save the new content.
7.  `contentService` returns the created content object.
8.  Route handler formats the response and sends it back. 