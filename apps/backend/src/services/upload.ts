import { config } from "../config"
import fs from "fs"
import path from "path"
import { pipeline } from "stream/promises"
import { mkdir } from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import { createUploadthing, type FileRouter } from "uploadthing/server"
import { UTApi } from "uploadthing/server"

// Initialize UploadThing if using CDN method
let utapi: UTApi | null = null
let uploadthing: ReturnType<typeof createUploadthing> | null = null

if (config.upload.method === "cdn") {
  if (!config.upload.uploadthing.secret || !config.upload.uploadthing.appId) {
    throw new Error("UploadThing credentials are required when using CDN upload method")
  }

  utapi = new UTApi({
    apiKey: config.upload.uploadthing.secret,
    fetch: fetch,
  })

  uploadthing = createUploadthing()
}

// Define allowed file types
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"]

// Define upload types
export type UploadType = "chapter" | "content" | "generic"

/**
 * Interface for upload result
 */
export interface UploadResult {
  fileName: string
  fileUrl: string
  fileKey?: string
  fileSize: number
  mimeType: string
}

/**
 * Interface for file upload options
 */
export interface FileUploadOptions {
  file: any // This will be a Fastify multipart file
  type: UploadType
  id?: string // Optional ID for chapter/content uploads
  userId: string
}

/**
 * Upload a file to the server
 * @param options Upload options
 * @returns Upload result
 */
export async function uploadFile(options: FileUploadOptions): Promise<UploadResult> {
  const { file, type, id, userId } = options

  // Validate file type based on upload type
  validateFileType(file.mimetype, type)

  // Use the appropriate upload method based on configuration
  if (config.upload.method === "server") {
    return uploadToServer(file, type, id)
  } else if (config.upload.method === "cdn") {
    return uploadToCDN(file, type, id, userId)
  } else {
    throw new Error(`Unsupported upload method: ${config.upload.method}`)
  }
}

/**
 * Validate file type based on upload type
 * @param mimeType File MIME type
 * @param type Upload type
 */
function validateFileType(mimeType: string, type: UploadType): void {
  if (type === "chapter" || type === "content") {
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`Invalid file type for ${type} upload. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`)
    }
  } else if (type === "generic") {
    if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].includes(mimeType)) {
      throw new Error(
        `Invalid file type for generic upload. Allowed types: ${[
          ...ALLOWED_IMAGE_TYPES,
          ...ALLOWED_DOCUMENT_TYPES,
        ].join(", ")}`,
      )
    }
  }
}

/**
 * Upload a file to the server
 * @param file Fastify multipart file
 * @param type Upload type
 * @param id Optional ID for chapter/content uploads
 * @returns Upload result
 */
async function uploadToServer(file: any, type: UploadType, id?: string): Promise<UploadResult> {
  // Determine upload directory based on type
  let uploadDir: string
  if (type === "chapter" && id) {
    uploadDir = path.join(config.paths.uploads, "chapters", id)
  } else if (type === "content" && id) {
    uploadDir = path.join(config.paths.uploads, "contents", id)
  } else {
    uploadDir = path.join(config.paths.uploads, "generic")
  }

  // Create directory if it doesn't exist
  await mkdir(uploadDir, { recursive: true })

  // Generate unique filename
  const fileExt = path.extname(file.filename)
  const fileName = `${uuidv4()}${fileExt}`
  const filePath = path.join(uploadDir, fileName)

  // Save file
  const writeStream = fs.createWriteStream(filePath)
  await pipeline(file.file, writeStream)

  // Determine file URL based on type
  let fileUrl: string
  if (type === "chapter" && id) {
    fileUrl = `/uploads/chapters/${id}/${fileName}`
  } else if (type === "content" && id) {
    fileUrl = `/uploads/contents/${id}/${fileName}`
  } else {
    fileUrl = `/uploads/generic/${fileName}`
  }

  return {
    fileName,
    fileUrl,
    fileSize: file.file.bytesRead,
    mimeType: file.mimetype,
  }
}

/**
 * Upload a file to CDN using UploadThing
 * @param file Fastify multipart file
 * @param type Upload type
 * @param id Optional ID for chapter/content uploads
 * @param userId User ID
 * @returns Upload result
 */
async function uploadToCDN(file: any, type: UploadType, id?: string, userId?: string): Promise<UploadResult> {
  if (!utapi) {
    throw new Error("UploadThing API is not initialized")
  }

  // Read file into buffer
  const chunks: Buffer[] = []
  for await (const chunk of file.file) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  // Determine folder based on type
  let folder: string
  if (type === "chapter" && id) {
    folder = `chapters/${id}`
  } else if (type === "content" && id) {
    folder = `contents/${id}`
  } else {
    folder = `generic/${userId || "anonymous"}`
  }

  // Upload to UploadThing
  const response = await utapi.uploadFiles({
    files: [
      {
        name: file.filename,
        type: file.mimetype,
        content: buffer,
      },
    ],
    metadata: {
      uploadedBy: userId || "anonymous",
      type,
      id: id || "none",
    },
    folder,
  })

  if (!response[0] || response[0].error) {
    throw new Error(`Failed to upload file: ${response[0]?.error || "Unknown error"}`)
  }

  return {
    fileName: response[0].name,
    fileUrl: response[0].url,
    fileKey: response[0].key,
    fileSize: response[0].size,
    mimeType: file.mimetype,
  }
}

/**
 * Delete a file
 * @param fileUrl File URL
 * @param fileKey Optional file key (required for CDN uploads)
 * @returns Boolean indicating success
 */
export async function deleteFile(fileUrl: string, fileKey?: string): Promise<boolean> {
  if (config.upload.method === "server") {
    // For server uploads, the fileUrl is relative to the uploads directory
    const filePath = path.join(config.paths.root, fileUrl)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } else if (config.upload.method === "cdn") {
    if (!utapi || !fileKey) {
      return false
    }

    try {
      await utapi.deleteFiles({
        fileKeys: [fileKey],
      })
      return true
    } catch (error) {
      console.error("Failed to delete file from CDN:", error)
      return false
    }
  }

  return false
}

/**
 * Create a file router for UploadThing (used in API routes)
 * @returns File router
 */
export function createFileRouter(): FileRouter | null {
  if (!uploadthing) {
    return null
  }

  // Define file router
  return {
    // Chapter image upload
    chapterImage: uploadthing({
      image: {
        maxFileSize: config.upload.maxFileSize,
        maxFileCount: 20,
      },
    })
      .middleware(({ req }) => {
        // Verify user is authenticated and has permission
        const user = req.user
        if (!user) {
          throw new Error("Unauthorized")
        }

        return { userId: user.id }
      })
      .onUploadComplete(({ metadata, file }) => {
        return { uploadedBy: metadata.userId, url: file.url }
      }),

    // Content image upload
    contentImage: uploadthing({
      image: {
        maxFileSize: config.upload.maxFileSize,
        maxFileCount: 1,
      },
    })
      .middleware(({ req }) => {
        // Verify user is authenticated and has permission
        const user = req.user
        if (!user) {
          throw new Error("Unauthorized")
        }

        return { userId: user.id }
      })
      .onUploadComplete(({ metadata, file }) => {
        return { uploadedBy: metadata.userId, url: file.url }
      }),

    // Generic file upload
    genericFile: uploadthing({
      image: {
        maxFileSize: config.upload.maxFileSize,
        maxFileCount: 1,
      },
      pdf: {
        maxFileSize: config.upload.maxFileSize,
        maxFileCount: 1,
      },
    })
      .middleware(({ req }) => {
        // Verify user is authenticated
        const user = req.user
        if (!user) {
          throw new Error("Unauthorized")
        }

        return { userId: user.id }
      })
      .onUploadComplete(({ metadata, file }) => {
        return { uploadedBy: metadata.userId, url: file.url }
      }),
  }
}
