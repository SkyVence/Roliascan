import type { FastifyInstance } from "fastify"
import { apiHandler, forbidden } from "../utils/handler"
import { uploadFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from "../services/upload"
import { checkPermission } from "../services/permission"

export default async function (fastify: FastifyInstance) {
  // Generic file upload endpoint
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      // Check if user has permission to upload files
      const hasPermission = await checkPermission(request.user.id, request.user.role, "upload:file")
      if (!hasPermission) {
        forbidden(reply, "You don't have permission to upload files")
        return
      }

      const parts = request.parts()
      const uploadedFiles = []

      for await (const part of parts) {
        if (part.type === "file") {
          // Validate file type
          const fileType = part.mimetype
          if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].includes(fileType)) {
            continue // Skip unsupported file types
          }

          // Upload file
          const result = await uploadFile({
            file: part,
            type: "generic",
            userId: request.user.id,
          })

          uploadedFiles.push(result)
        }
      }

      return { files: uploadedFiles }
    }),
  )

  // Content image upload endpoint
  fastify.post(
    "/content/:id",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }

      // Check if user has permission to upload content images
      const hasPermission = await checkPermission(request.user.id, request.user.role, "update:content")
      if (!hasPermission) {
        forbidden(reply, "You don't have permission to upload content images")
        return
      }

      const parts = request.parts()
      const uploadedFiles = []

      for await (const part of parts) {
        if (part.type === "file") {
          // Validate file type
          const fileType = part.mimetype
          if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
            continue // Skip non-image files
          }

          // Upload file
          const result = await uploadFile({
            file: part,
            type: "content",
            id,
            userId: request.user.id,
          })

          uploadedFiles.push(result)
        }
      }

      return { files: uploadedFiles }
    }),
  )
}
