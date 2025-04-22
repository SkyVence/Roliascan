# API Documentation

This section outlines the backend API endpoints, request/response formats, authentication methods, and rate limiting.

## Authentication

Authentication is handled using JSON Web Tokens (JWT). Clients must include a valid JWT in the `Authorization` header for protected endpoints:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained via the `/auth/login` endpoint and can be verified using the `/auth/me` endpoint.

## Endpoints

### Auth (`/auth`)

Routes related to user authentication.

*   **`POST /auth/register`**
    *   **Description:** Registers a new user.
    *   **Request Body:**
        ```json
        {
          "email": "user@example.com",
          "username": "newuser",
          "password": "password123"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "token": "jwt_token_string",
          "user": {
            "id": "user_uuid",
            "email": "user@example.com",
            "username": "newuser",
            "role": "USER" // or other roles
          }
        }
        ```
    *   **Response (Error 400):** If email/username already exists or validation fails.
        ```json
        {
          "statusCode": 400,
          "error": "Bad Request",
          "message": "User with this email already exists" // or "Username already taken"
        }
        ```

*   **`POST /auth/login`**
    *   **Description:** Logs in an existing user.
    *   **Request Body:**
        ```json
        {
          "email": "user@example.com",
          "password": "password123"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "token": "jwt_token_string",
          "user": {
            "id": "user_uuid",
            "email": "user@example.com",
            "username": "currentuser",
            "role": "USER",
            "isMuted": false
          }
        }
        ```
    *   **Response (Error 401):** If credentials are invalid or the user is banned.
        ```json
        {
          "statusCode": 401,
          "error": "Unauthorized",
          "message": "Invalid credentials" // or "Your account has been banned"
        }
        ```

*   **`GET /auth/me`**
    *   **Description:** Retrieves the profile of the currently authenticated user.
    *   **Authentication:** Required (Bearer Token).
    *   **Response (Success 200):**
        ```json
        {
          "user": {
            "id": "user_uuid",
            "email": "user@example.com",
            "username": "currentuser",
            "role": "USER",
            "isMuted": false,
            "isBanned": false
          }
        }
        ```
    *   **Response (Error 401):** If the token is invalid or the user is not found.
        ```json
        {
          "statusCode": 401,
          "error": "Unauthorized",
          "message": "Unauthorized" // or "User not found"
        }
        ```

### User (`/user`)

Routes for managing user profiles and permissions.

*   **`GET /user/:id`**
    *   **Description:** Retrieves a public user profile by ID.
    *   **Parameters:**
        *   `id` (path): The UUID of the user.
    *   **Response (Success 200):**
        ```json
        {
          "user": {
            "id": "user_uuid",
            "username": "someuser",
            "role": "USER",
            "createdAt": "iso_timestamp"
          }
        }
        ```
    *   **Response (Error 404):** If the user is not found.
        ```json
        {
          "statusCode": 404,
          "error": "Not Found",
          "message": "User not found"
        }
        ```

*   **`PATCH /user/profile`**
    *   **Description:** Updates the profile of the currently authenticated user.
    *   **Authentication:** Required (Bearer Token).
    *   **Request Body (Optional fields):**
        ```json
        {
          "username": "newusername",
          "email": "new@example.com",
          "password": "newpassword123" // Provide only if changing password
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "user": {
            "id": "user_uuid",
            "email": "new@example.com", // or old if not changed
            "username": "newusername", // or old if not changed
            "role": "USER"
          }
        }
        ```
    *   **Response (Error 400):** If username/email is already taken.
        ```json
        {
          "statusCode": 400,
          "error": "Bad Request",
          "message": "Username already taken" // or "Email already taken"
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 404):** Should not happen if authenticated.

*   **`GET /user/permissions`**
    *   **Description:** Retrieves the permissions of the currently authenticated user.
    *   **Authentication:** Required (Bearer Token).
    *   **Response (Success 200):**
        ```json
        {
          "permissions": ["permission1", "permission2"]
        }
        ```
    *   **Response (Error 401):** If not authenticated.

### Upload (`/upload`)

Routes for handling file uploads. Uses `multipart/form-data`.

*   **`POST /upload/`**
    *   **Description:** Uploads one or more generic files (images or documents). Requires `upload:file` permission.
    *   **Authentication:** Required (Bearer Token).
    *   **Request:** `multipart/form-data` with file field(s) (e.g., name="files").
    *   **Allowed File Types:** Images (`image/jpeg`, `image/png`, `image/gif`, etc.) and Documents (`application/pdf`, etc. - *check `ALLOWED_DOCUMENT_TYPES` in `services/upload`*).
    *   **Response (Success 200):**
        ```json
        {
          "files": [
            {
              "fileName": "generated_filename.jpg",
              "originalName": "original_image.jpg",
              "url": "/uploads/generic/generated_filename.jpg",
              "size": 123456,
              "type": "image/jpeg"
            },
            // ... more files if multiple uploaded
          ]
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks `upload:file` permission.
    *   **Response (Error 413):** If file size exceeds configured limit (`config.upload.maxFileSize`).

*   **`POST /upload/content/:id`**
    *   **Description:** Uploads one or more image files associated with a specific content item. Requires `update:content` permission.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the content item.
    *   **Request:** `multipart/form-data` with file field(s) (e.g., name="images").
    *   **Allowed File Types:** Images (`image/jpeg`, `image/png`, `image/gif`, etc. - *check `ALLOWED_IMAGE_TYPES` in `services/upload`*).
    *   **Response (Success 200):**
        ```json
        {
          "files": [
            {
              "fileName": "generated_filename.png",
              "originalName": "cover_art.png",
              "url": "/uploads/contents/content_uuid/generated_filename.png",
              "size": 98765,
              "type": "image/png"
            },
            // ... more files if multiple uploaded
          ]
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks `update:content` permission.
    *   **Response (Error 413):** If file size exceeds configured limit (`config.upload.maxFileSize`).

### Content (`/content`)

Routes for managing content items (e.g., manga, comics, books).

*   **`GET /content/`**
    *   **Description:** Retrieves a list of content items with pagination and sorting.
    *   **Authentication:** None required.
    *   **Query Parameters:**
        *   `page` (optional, number, default=1): Page number for pagination.
        *   `limit` (optional, number, default=10): Number of items per page.
        *   `sort` (optional, string, default='newest'): Sorting order ('newest', 'name').
    *   **Response (Success 200):**
        ```json
        {
          "data": [
            {
              "id": "content_uuid_1",
              "slug": "content-slug-1",
              "name": "Content Name 1",
              "author": "Author Name",
              "coverImage": "/uploads/contents/content_uuid_1/cover.jpg",
              "createdAt": "iso_timestamp",
              "updatedAt": "iso_timestamp",
              "chaptersCount": 15,
              "averageRating": 4.5
              // ... other fields from contentService.getContents
            },
            // ... more content items
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 48,
            "limit": 10
          }
        }
        ```

*   **`GET /content/:idOrSlug`**
    *   **Description:** Retrieves a single content item by its UUID or slug.
    *   **Authentication:** None required.
    *   **Parameters:**
        *   `idOrSlug` (path): The UUID or unique slug of the content item.
    *   **Response (Success 200):**
        ```json
        {
          // Full content object from contentService.getContent
          "id": "content_uuid",
          "slug": "content-slug",
          "name": "Content Name",
          "description": "Detailed description...",
          "author": "Author Name",
          "coverImage": "/uploads/contents/content_uuid/cover.jpg",
          "createdById": "creator_user_uuid",
          "createdAt": "iso_timestamp",
          "updatedAt": "iso_timestamp",
          "chapters": [
            // ... list of associated chapters
          ],
          "ratings": [
            // ... list of associated ratings
          ],
          "comments": [
            // ... list of associated comments
          ]
          // ... other fields
        }
        ```
    *   **Response (Error 404):** If content with the given ID/slug is not found.
        ```json
        {
          "statusCode": 404,
          "error": "Not Found",
          "message": "Content not found"
        }
        ```

*   **`POST /content/`**
    *   **Description:** Creates a new content item. Requires `create:content` permission.
    *   **Authentication:** Required (Bearer Token).
    *   **Request Body:**
        ```json
        {
          "name": "New Content Title",
          "description": "Optional description.",
          "author": "Creator Author",
          "coverImage": "/uploads/generic/some_uploaded_image.jpg" // Optional, URL from a previous upload
        }
        ```
    *   **Response (Success 200/201):**
        ```json
        {
          "content": {
            "id": "new_content_uuid",
            "slug": "new-content-title",
            "name": "New Content Title",
            "description": "Optional description.",
            "author": "Creator Author",
            "coverImage": "/uploads/contents/new_content_uuid/some_uploaded_image.jpg", // Path might be adjusted
            "createdById": "authenticated_user_uuid",
            "createdAt": "iso_timestamp",
            "updatedAt": "iso_timestamp"
            // ... other default fields
          }
        }
        ```
    *   **Response (Error 400):** If validation fails (e.g., missing name/author).
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks `create:content` permission.

*   **`PATCH /content/:id`**
    *   **Description:** Updates an existing content item. Requires user to be the creator or have admin/moderator role.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the content item to update.
    *   **Request Body (Optional fields):**
        ```json
        {
          "name": "Updated Content Title",
          "description": "Updated description.",
          "author": "Updated Author",
          "coverImage": "/uploads/generic/new_cover.png"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "content": {
            // Updated content object
            "id": "content_uuid",
            "slug": "updated-content-title", // Slug might update
            "name": "Updated Content Title",
            // ... other updated fields
          }
        }
        ```
    *   **Response (Error 400):** If validation fails.
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks permission to update this specific content.
    *   **Response (Error 404):** If content with the given ID is not found.

*   **`DELETE /content/:id`**
    *   **Description:** Deletes a content item. Requires user to be the creator or have admin role.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the content item to delete.
    *   **Response (Success 200):**
        ```json
        {
          "success": true,
          "message": "Content deleted successfully"
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks permission to delete this specific content.
    *   **Response (Error 404):** If content with the given ID is not found.

### Chapter (`/chapter`)

Routes for managing content chapters and their associated images.

*   **`GET /chapter/`**
    *   **Description:** Retrieves a list of chapters. Primarily used to get chapters for a specific content item.
    *   **Authentication:** None required.
    *   **Query Parameters:**
        *   `contentId` (optional, string uuid): If provided, returns chapters belonging to this content ID.
        *   `page` (optional, number): *Note: Pagination seems implemented only when `contentId` is NOT provided, and the 'all chapters' fetch appears incomplete.*
        *   `limit` (optional, number): *Note: See `page`.*
    *   **Response (Success 200 - with `contentId`):**
        ```json
        {
          "data": [
            {
              "id": "chapter_uuid_1",
              "name": "Chapter One: The Beginning",
              "chapterNumber": 1,
              "contentId": "content_uuid",
              "createdAt": "iso_timestamp",
              "updatedAt": "iso_timestamp",
              "createdById": "user_uuid",
              "pagesCount": 20 // Example field
            },
            // ... more chapters for the content
          ],
          "pagination": { // Simplified pagination when fetching by contentId
            "total": 15,
            "page": 1,
            "limit": 15,
            "pages": 1
          }
        }
        ```
    *   **Response (Success 200 - without `contentId`):**
        ```json
        // NOTE: Current implementation seems to return empty array.
        {
          "data": [],
          "pagination": {
            "total": 0,
            "page": 1,
            "limit": 20,
            "pages": 0
          }
        }
        ```

*   **`GET /chapter/:id`**
    *   **Description:** Retrieves a single chapter by its UUID, including its pages/images.
    *   **Authentication:** None required.
    *   **Parameters:**
        *   `id` (path): The UUID of the chapter.
    *   **Response (Success 200):**
        ```json
        {
          "id": "chapter_uuid",
          "name": "Chapter Title",
          "chapterNumber": 5,
          "contentId": "content_uuid",
          "createdAt": "iso_timestamp",
          "updatedAt": "iso_timestamp",
          "createdById": "user_uuid",
          "images": [
            {
              "id": "image_uuid_1",
              "pageNumber": 1,
              "url": "/uploads/chapters/chapter_uuid/image1.jpg",
              "fileKey": "chapters/chapter_uuid/image1.jpg",
              "createdAt": "iso_timestamp"
            },
            {
              "id": "image_uuid_2",
              "pageNumber": 2,
              "url": "/uploads/chapters/chapter_uuid/image2.jpg",
              "fileKey": "chapters/chapter_uuid/image2.jpg",
              "createdAt": "iso_timestamp"
            }
            // ... more images ordered by pageNumber
          ]
        }
        ```
    *   **Response (Error 404):** If the chapter is not found.
        ```json
        {
          "statusCode": 404,
          "error": "Not Found",
          "message": "Chapter not found"
        }
        ```

*   **`POST /chapter/`**
    *   **Description:** Creates a new chapter for a specific content item. Requires `create:chapter` permission.
    *   **Authentication:** Required (Bearer Token).
    *   **Request Body:**
        ```json
        {
          "contentId": "existing_content_uuid",
          "name": "Chapter Title",
          "chapterNumber": 10
        }
        ```
    *   **Response (Success 200/201):**
        ```json
        {
          "chapter": {
            "id": "new_chapter_uuid",
            "name": "Chapter Title",
            "chapterNumber": 10,
            "contentId": "existing_content_uuid",
            "createdById": "authenticated_user_uuid",
            "createdAt": "iso_timestamp",
            "updatedAt": "iso_timestamp",
            "images": [] // Initially empty
          }
        }
        ```
    *   **Response (Error 400):** If validation fails or contentId is invalid/duplicate chapter number for content.
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks `create:chapter` permission.

*   **`POST /chapter/:id/images`**
    *   **Description:** Uploads one or more images (pages) for a specific chapter. Requires user to be the creator or have admin/moderator role. Uses `multipart/form-data`.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the chapter.
    *   **Request:** `multipart/form-data` with image file field(s). Field names like `page_1`, `page_2` can specify order, otherwise they are appended.
    *   **Allowed File Types:** Images (`image/jpeg`, `image/png`, `image/gif`, etc. - *check `ALLOWED_IMAGE_TYPES` in `services/upload`*).
    *   **Response (Success 200):**
        ```json
        {
          "images": [
            {
              "id": "new_image_uuid_1",
              "pageNumber": 1, // Or inferred next number
              "url": "/uploads/chapters/chapter_uuid/generated_name1.jpg",
              "fileKey": "chapters/chapter_uuid/generated_name1.jpg",
              "createdAt": "iso_timestamp"
            },
            // ... more uploaded images
          ]
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks permission to upload to this chapter.
    *   **Response (Error 404):** If the chapter is not found.
    *   **Response (Error 413):** If an image file size exceeds the configured limit.

*   **`PATCH /chapter/:id`**
    *   **Description:** Updates an existing chapter's details (name, number). Requires user to be the creator or have admin/moderator role.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the chapter to update.
    *   **Request Body (Optional fields):**
        ```json
        {
          "name": "Updated Chapter Title",
          "chapterNumber": 11
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "chapter": {
            // Updated chapter object (excluding images maybe, depends on service)
            "id": "chapter_uuid",
            "name": "Updated Chapter Title",
            "chapterNumber": 11,
            // ... other fields
          }
        }
        ```
    *   **Response (Error 400):** If validation fails or chapter number conflict.
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks permission to update this chapter.
    *   **Response (Error 404):** If the chapter is not found.

*   **`DELETE /chapter/:id`**
    *   **Description:** Deletes a chapter and its associated images. Requires user to be the creator or have admin role.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the chapter to delete.
    *   **Response (Success 200):**
        ```json
        {
          "success": true,
          "message": "Chapter deleted successfully"
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If user lacks permission to delete this chapter.
    *   **Response (Error 404):** If the chapter is not found.

### Comment (`/comment`)

Routes for managing comments on chapters.

*   **`GET /comment/chapter/:chapterId`**
    *   **Description:** Retrieves comments for a specific chapter with pagination.
    *   **Authentication:** None required.
    *   **Parameters:**
        *   `chapterId` (path): The UUID of the chapter.
    *   **Query Parameters:**
        *   `page` (optional, number, default=1): Page number for pagination.
        *   `limit` (optional, number, default=20): Number of comments per page.
    *   **Response (Success 200):**
        ```json
        {
          "data": [
            {
              "id": "comment_uuid_1",
              "content": "This is a comment!",
              "userId": "user_uuid",
              "chapterId": "chapter_uuid",
              "createdAt": "iso_timestamp",
              "updatedAt": "iso_timestamp",
              "user": { // User details likely included by the service
                "id": "user_uuid",
                "username": "commenter_user"
              }
            },
            // ... more comments
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "totalItems": 55,
            "limit": 20
          }
        }
        ```
    *   **Response (Error 404):** If the chapter is not found.

*   **`POST /comment/`**
    *   **Description:** Creates a new comment on a chapter. Requires authentication.
    *   **Authentication:** Required (Bearer Token).
    *   **Request Body:**
        ```json
        {
          "chapterId": "existing_chapter_uuid",
          "content": "My thoughts on this chapter..."
        }
        ```
    *   **Response (Success 200/201):**
        ```json
        {
          "comment": {
            "id": "new_comment_uuid",
            "content": "My thoughts on this chapter...",
            "userId": "authenticated_user_uuid",
            "chapterId": "existing_chapter_uuid",
            "createdAt": "iso_timestamp",
            "updatedAt": "iso_timestamp"
            // User details might be included here too
          }
        }
        ```
    *   **Response (Error 400):** If validation fails (e.g., empty content).
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If the user is muted.
    *   **Response (Error 404):** If the chapter or authenticated user is not found.

*   **`PATCH /comment/:id`**
    *   **Description:** Updates an existing comment. Requires user to be the author.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the comment to update.
    *   **Request Body:**
        ```json
        {
          "content": "My updated thoughts..."
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "comment": {
            // Updated comment object
            "id": "comment_uuid",
            "content": "My updated thoughts...",
            // ... other fields
          }
        }
        ```
    *   **Response (Error 400):** If validation fails.
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If the user is not the author of the comment.
    *   **Response (Error 404):** If the comment is not found.

*   **`DELETE /comment/:id`**
    *   **Description:** Deletes a comment. Requires user to be the author or have admin/moderator role.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `id` (path): The UUID of the comment to delete.
    *   **Response (Success 200):**
        ```json
        {
          "success": true,
          "message": "Comment deleted successfully"
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 403):** If the user lacks permission to delete this comment.
    *   **Response (Error 404):** If the comment is not found.
    *   **Response (Error 500):** If deletion fails unexpectedly.

### Rating (`/rating`)

Routes for submitting and retrieving ratings for content and chapters.

*   **`POST /rating/content`**
    *   **Description:** Submits or updates the authenticated user's rating for a specific content item.
    *   **Authentication:** Required (Bearer Token).
    *   **Request Body:**
        ```json
        {
          "contentId": "existing_content_uuid",
          "rating": 4 // Integer between 1 and 5
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "message": "Rating submitted successfully"
        }
        ```
    *   **Response (Error 400):** If validation fails (invalid rating, invalid contentId, etc.).
    *   **Response (Error 401):** If not authenticated.

*   **`POST /rating/chapter`**
    *   **Description:** Submits or updates the authenticated user's rating for a specific chapter.
    *   **Authentication:** Required (Bearer Token).
    *   **Request Body:**
        ```json
        {
          "chapterId": "existing_chapter_uuid",
          "rating": 5 // Integer between 1 and 5
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "message": "Rating submitted successfully"
        }
        ```
    *   **Response (Error 400):** If validation fails (invalid rating, invalid chapterId, etc.).
    *   **Response (Error 401):** If not authenticated.

*   **`GET /rating/content/:contentId/user`**
    *   **Description:** Retrieves the authenticated user's rating for a specific content item.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `contentId` (path): The UUID of the content item.
    *   **Response (Success 200):**
        ```json
        {
          "rating": 4 // The user's rating (1-5), or null if not rated
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 404):** If the content item is not found (though the service might just return null rating).

*   **`GET /rating/chapter/:chapterId/user`**
    *   **Description:** Retrieves the authenticated user's rating for a specific chapter.
    *   **Authentication:** Required (Bearer Token).
    *   **Parameters:**
        *   `chapterId` (path): The UUID of the chapter.
    *   **Response (Success 200):**
        ```json
        {
          "rating": 5 // The user's rating (1-5), or null if not rated
        }
        ```
    *   **Response (Error 401):** If not authenticated.
    *   **Response (Error 404):** If the chapter is not found (though the service might just return null rating).

### Admin (`/admin`)

Routes for administrative actions. Access is restricted based on user roles (Admin, Moderator).

*   **`PATCH /admin/users/:id/role`**
    *   **Description:** Updates the role of a specific user. Requires Admin role.
    *   **Authentication:** Required (Bearer Token, Admin Role).
    *   **Parameters:**
        *   `id` (path): The UUID of the user to update.
    *   **Request Body:**
        ```json
        {
          "role": "moderator" // Must be one of "admin", "moderator", "uploader", "user"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "message": "User role updated to moderator"
        }
        ```
    *   **Response (Error 400):** If validation fails or trying to change own role (likely).
    *   **Response (Error 401/403):** If not authenticated or not an Admin.
    *   **Response (Error 404):** If the user is not found.

*   **`PATCH /admin/users/:id/ban`**
    *   **Description:** Bans or unbans a specific user. Requires Admin role.
    *   **Authentication:** Required (Bearer Token, Admin Role).
    *   **Parameters:**
        *   `id` (path): The UUID of the user to ban/unban.
    *   **Request Body:**
        ```json
        {
          "isBanned": true // boolean
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "message": "User banned successfully" // or "User unbanned successfully"
        }
        ```
    *   **Response (Error 400):** If trying to ban an admin user.
    *   **Response (Error 401/403):** If not authenticated or not an Admin.
    *   **Response (Error 404):** If the user is not found.

*   **`PATCH /admin/users/:id/mute`**
    *   **Description:** Mutes or unmutes a specific user. Requires Admin or Moderator role.
    *   **Authentication:** Required (Bearer Token, Admin or Moderator Role).
    *   **Parameters:**
        *   `id` (path): The UUID of the user to mute/unmute.
    *   **Request Body:**
        ```json
        {
          "isMuted": true // boolean
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "message": "User muted successfully" // or "User unmuted successfully"
        }
        ```
    *   **Response (Error 400):** If trying to mute an admin, or a moderator trying to mute another mod/admin.
    *   **Response (Error 401/403):** If not authenticated or lacking required role.
    *   **Response (Error 404):** If the user is not found.

*   **`POST /admin/permissions`**
    *   **Description:** Creates a new permission type available in the system. Requires Admin role.
    *   **Authentication:** Required (Bearer Token, Admin Role).
    *   **Request Body:**
        ```json
        {
          "name": "delete:any_comment",
          "description": "Allows deleting comments made by any user."
        }
        ```
    *   **Response (Success 200/201):**
        ```json
        {
          "id": "new_permission_uuid",
          "name": "delete:any_comment",
          "description": "Allows deleting comments made by any user."
        }
        ```
    *   **Response (Error 400):** If validation fails (e.g., duplicate permission name).
    *   **Response (Error 401/403):** If not authenticated or not an Admin.

*   **`POST /admin/users/:id/permissions`**
    *   **Description:** Assigns an existing permission to a specific user. Requires Admin role.
    *   **Authentication:** Required (Bearer Token, Admin Role).
    *   **Parameters:**
        *   `id` (path): The UUID of the user to assign the permission to.
    *   **Request Body:**
        ```json
        {
          "permissionId": "existing_permission_uuid"
        }
        ```
    *   **Response (Success 200):**
        ```json
        {
          "message": "Permission assigned successfully"
        }
        ```
    *   **Response (Error 400):** If the permission ID is invalid or the user already has the permission.
    *   **Response (Error 401/403):** If not authenticated or not an Admin.
    *   **Response (Error 404):** If the user or permission is not found.

*   **`DELETE /admin/users/:userId/permissions/:permissionId`**
    *   **Description:** Removes a specific permission from a user. Requires Admin role.
    *   **Authentication:** Required (Bearer Token, Admin Role).
    *   **Parameters:**
        *   `userId` (path): The UUID of the user.
        *   `permissionId` (path): The UUID of the permission to remove.
    *   **Response (Success 200):**
        ```json
        {
          "message": "Permission removed successfully"
        }
        ```
    *   **Response (Error 400):** If the permission ID is invalid.
    *   **Response (Error 401/403):** If not authenticated or not an Admin.
    *   **Response (Error 404):** If the user is not found or does not have the specified permission.

*   **`GET /admin/users`**
    *   **Description:** Retrieves a list of all users with pagination. Requires Admin role.
    *   **Authentication:** Required (Bearer Token, Admin Role).
    *   **Query Parameters:**
        *   `page` (optional, number, default=1): Page number for pagination.
        *   `limit` (optional, number, default=20): Number of users per page.
    *   **Response (Success 200):**
        ```json
        // NOTE: Current implementation seems to return empty array.
        // Expected structure:
        {
          "data": [
            {
              "id": "user_uuid_1",
              "email": "user1@example.com",
              "username": "user1",
              "role": "user",
              "isMuted": false,
              "isBanned": false,
              "createdAt": "iso_timestamp"
              // ... other user fields
            },
            // ... more users
          ],
          "pagination": {
            "total": 150,
            "page": 1,
            "limit": 20,
            "pages": 8
          }
        }
        ```
    *   **Response (Error 401/403):** If not authenticated or not an Admin.

---

## Data Models

These are the primary data structures returned by the API endpoints, based on the database schemas. Note that specific endpoints might return subsets or variations of these structures, and sensitive fields (like passwords) are omitted.

### User
Represents a registered user.

```json
{
  "id": "uuid",
  "email": "string (email format)",
  "username": "string",
  "role": "string (e.g., 'user', 'moderator', 'admin')",
  "isBanned": "boolean",
  "isMuted": "boolean",
  "createdAt": "string (iso_timestamp)",
  "updatedAt": "string (iso_timestamp)"
}
```

### User (Public Profile)
A simplified user object often returned for public display.

```json
{
  "id": "uuid",
  "username": "string",
  "role": "string",
  "createdAt": "string (iso_timestamp)"
}
```

### Permission
Represents an action a user might be allowed to perform.

```json
{
  "id": "uuid",
  "name": "string (e.g., 'create:content')",
  "description": "string (optional)"
}
```

### Content
Represents a main content item like a manga or comic series.

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string (unique URL-friendly identifier)",
  "description": "string (optional)",
  "author": "string",
  "coverImage": "string (URL path, optional)",
  "createdById": "uuid (user ID)",
  "createdAt": "string (iso_timestamp)",
  "updatedAt": "string (iso_timestamp)",
  // Additional fields might be included depending on the endpoint:
  "chaptersCount": "number (calculated)",
  "averageRating": "number (calculated, 1-5 or null)",
  "createdBy": { /* User (Public Profile) object */ },
  "chapters": [ /* Array of Chapter objects */ ],
  "ratings": [ /* Array of ContentRating objects */ ],
  "comments": [ /* Array of Comment objects (if comments were on content) */ ]
}
```

### Chapter
Represents a chapter within a Content item.

```json
{
  "id": "uuid",
  "contentId": "uuid",
  "name": "string",
  "chapterNumber": "number",
  "createdById": "uuid (user ID)",
  "createdAt": "string (iso_timestamp)",
  "updatedAt": "string (iso_timestamp)",
  // Additional fields might be included depending on the endpoint:
  "pagesCount": "number (calculated)",
  "averageRating": "number (calculated, 1-5 or null)",
  "createdBy": { /* User (Public Profile) object */ },
  "content": { /* Basic Content object (id, name, slug) */ },
  "images": [ /* Array of ChapterImage objects */ ],
  "comments": [ /* Array of Comment objects */ ],
  "ratings": [ /* Array of ChapterRating objects */ ]
}
```

### ChapterImage
Represents a single page image within a Chapter.

```json
{
  "id": "uuid",
  "chapterId": "uuid",
  "imageUrl": "string (URL path)",
  "pageNumber": "number",
  "createdAt": "string (iso_timestamp)"
}
```

### Comment
Represents a user comment on a Chapter.

```json
{
  "id": "uuid",
  "chapterId": "uuid",
  "userId": "uuid",
  "content": "string",
  "createdAt": "string (iso_timestamp)",
  "updatedAt": "string (iso_timestamp)",
  "user": { /* User (Public Profile) object */ }
}
```

### ContentRating
Represents a user's rating for a Content item.

```json
{
  "id": "uuid",
  "contentId": "uuid",
  "userId": "uuid",
  "rating": "number (1-5)",
  "createdAt": "string (iso_timestamp)",
  "updatedAt": "string (iso_timestamp)",
  "user": { /* User (Public Profile) object, optional */ }
}
```

### ChapterRating
Represents a user's rating for a Chapter.

```json
{
  "id": "uuid",
  "chapterId": "uuid",
  "userId": "uuid",
  "rating": "number (1-5)",
  "createdAt": "string (iso_timestamp)",
  "updatedAt": "string (iso_timestamp)",
  "user": { /* User (Public Profile) object, optional */ }
}
```

### UploadedFile
Represents the response object after a successful file upload.

```json
{
  "fileName": "string (generated filename)",
  "originalName": "string (original filename)",
  "url": "string (URL path to access the file)",
  "size": "number (bytes)",
  "type": "string (mime type)"
}
```

- Error Handling
- Rate Limiting 