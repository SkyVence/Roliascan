# Upload Handling

This document details how file uploads are processed, stored, and managed by the backend.

## Overview

File uploads are handled by the `uploadFile` function within `apps/backend/src/services/upload.ts`. The behavior depends significantly on the `UPLOAD_METHOD` configuration.

Uploads occur via specific API endpoints (see [API Docs - Upload Section](../api/README.md#upload-upload)) which use `multipart/form-data`.

## Configuration

The following environment variables control upload behavior (see [Configuration Docs](../configuration/README.md) for defaults):

*   `UPLOAD_METHOD`: Determines the storage strategy (`server` or `cdn`).
*   `MAX_FILE_SIZE`: Sets the maximum allowed size for a single uploaded file (in bytes).
*   `UPLOAD_DIR`: (Used only if `UPLOAD_METHOD=server`) Specifies the base directory for local file storage, relative to the backend application root.
*   `UPLOADTHING_SECRET`: (Used only if `UPLOAD_METHOD=cdn`) Your UploadThing API Key.
*   `UPLOADTHING_APP_ID`: (Used only if `UPLOAD_METHOD=cdn`) Your UploadThing App ID.

## File Validation

Before storing, files undergo validation:

1.  **Size:** The file size must not exceed `MAX_FILE_SIZE`.
2.  **Type:** The MIME type is checked based on the upload context:
    *   **Chapter Images (`/upload/chapter/:id`):** Must be one of `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
    *   **Content Images (`/upload/content/:id`):** Must be one of `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
    *   **Generic Files (`/upload/`):** Must be one of the allowed image types *or* `application/pdf`.
    *   Files with invalid MIME types for the context are rejected.

## Storage Methods

### Method 1: `server` (Local Filesystem)

*   **How it works:** Files are streamed directly to the server's local disk.
*   **Storage Path:** Files are saved within the directory specified by `UPLOAD_DIR` (e.g., `./uploads`). Subdirectories are created dynamically:
    *   Generic files: `{UPLOAD_DIR}/generic/`
    *   Content files: `{UPLOAD_DIR}/contents/<content_id>/`
    *   Chapter files: `{UPLOAD_DIR}/chapters/<chapter_id>/`
*   **Filename:** A unique filename is generated using `uuidv4()` plus the original file extension (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`).
*   **Returned URL (`fileUrl`):** A relative URL path used to access the file via the server (e.g., `/uploads/generic/uuid.jpg`). The backend server (or a reverse proxy like Nginx) must be configured to serve static files from the `UPLOAD_DIR` under the `/uploads/` path prefix.
*   **Deletion:** Requires the relative `fileUrl`. The service constructs the full filesystem path and uses `fs.unlinkSync`.

### Method 2: `cdn` (UploadThing)

*   **How it works:** Files are buffered in memory and then uploaded to [UploadThing](https://uploadthing.com/) using their server-side SDK.
*   **Storage Path:** UploadThing manages the actual storage. Files are organized within your UploadThing app using folders:
    *   Generic files: `generic/<user_id_or_anonymous>/`
    *   Content files: `contents/<content_id>/`
    *   Chapter files: `chapters/<chapter_id>/`
*   **Filename:** UploadThing typically uses a generated name, but the original name might be preserved or available in metadata.
*   **Returned URL (`fileUrl`):** A full, publicly accessible URL provided by UploadThing (e.g., `https://utfs.io/f/your-file-key.jpg`).
*   **Returned Key (`fileKey`):** An identifier used by UploadThing to manage the file (e.g., `your-file-key.jpg`). **This key is required for deletion.**
*   **Deletion:** Requires the `fileKey`. The service calls `utapi.deleteFiles`.

## Security Considerations

*   **Authentication/Authorization:** Upload endpoints require authentication, and specific permissions (`upload:file`, `update:content`) might be checked before allowing uploads.
*   **File Type Validation:** Strict MIME type validation helps prevent users from uploading potentially harmful file types disguised as allowed types.
*   **Resource Limits:** `MAX_FILE_SIZE` prevents denial-of-service attacks via excessively large files.
*   **Storage Access (`server` method):** Ensure the Node.js process has the correct write permissions for the `UPLOAD_DIR` but restrict broader filesystem access.
*   **CDN Credentials (`cdn` method):** Keep `UPLOADTHING_SECRET` secure; do not commit it directly to your repository. 