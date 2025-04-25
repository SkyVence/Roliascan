import type { FastifyInstance } from "fastify"
import fastifyJwt from "@fastify/jwt"
import fastifyCors from "@fastify/cors"
import fastifyMultipart from "@fastify/multipart"
import fastifyStatic from "@fastify/static"
import fastifyCookie from "@fastify/cookie"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "./db"
import { config } from "./config"
import { authenticate, adminOnly, adminOrModOnly, hasPermission } from "./middleware/auth"
import { checkPermission } from "./services/permission"
import fs from "fs"
import path from "path"

// Import routes
import authRoutes from "./routes/auth"
import userRoutes from "./routes/user"
import contentRoutes from "./routes/content"
import chapterRoutes from "./routes/chapter"
import commentRoutes from "./routes/comment"
import ratingRoutes from "./routes/rating"
import adminRoutes from "./routes/admin"
import uploadRoutes from "./routes/upload"

/**
 * Setup Fastify plugins and decorators
 * @param fastify Fastify instance
 */
export function setupFastify(fastify: FastifyInstance) {
  // Register plugins
  fastify.register(fastifyCors, {
    // origin: true, // Adjust according to your needs
    origin: true,
    credentials: true,
  })

  fastify.register(fastifyCookie, {
    secret: config.jwt.secret,
    hook: 'onRequest',
  })

  fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
    cookie: {
      cookieName: 'token',
      signed: true
    }
  })

  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: config.upload.maxFileSize,
    },
  })

  // Ensure uploads directory exists
  const uploadsDir = config.paths.uploads
  const chaptersDir = path.join(uploadsDir, "chapters")
  const contentsDir = path.join(uploadsDir, "contents")
  const genericDir = path.join(uploadsDir, "generic")

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir, { recursive: true })
  }

  if (!fs.existsSync(contentsDir)) {
    fs.mkdirSync(contentsDir, { recursive: true })
  }

  if (!fs.existsSync(genericDir)) {
    fs.mkdirSync(genericDir, { recursive: true })
  }

  // Serve static files (for uploaded images)
  fastify.register(fastifyStatic, {
    root: uploadsDir,
    prefix: "/uploads/",
  })

  // Register authentication decorator
  fastify.decorate("authenticate", authenticate)
  fastify.decorate("adminOnly", adminOnly)
  fastify.decorate("adminOrModOnly", adminOrModOnly)
  fastify.decorate("hasPermission", hasPermission)
  fastify.decorate("checkPermission", checkPermission)
}

/**
 * Setup Fastify routes
 * @param fastify Fastify instance
 */
export function setupFastifyRoutes(fastify: FastifyInstance) {
  // Register routes
  fastify.register(authRoutes, { prefix: "/auth" })
  fastify.register(userRoutes, { prefix: "/user" })
  fastify.register(contentRoutes, { prefix: "/content" })
  fastify.register(chapterRoutes, { prefix: "/chapter" })
  fastify.register(commentRoutes, { prefix: "/comment" })
  fastify.register(ratingRoutes, { prefix: "/rating" })
  fastify.register(adminRoutes, { prefix: "/admin" })
  fastify.register(uploadRoutes, { prefix: "/upload" })
  console.log("Routes setup complete")

  // Health check route
  fastify.get("/health", async () => {
    return { status: "ok" }
  })
}

/**
 * Start Fastify server
 * @param fastify Fastify instance
 */
export async function startFastify(fastify: FastifyInstance) {
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: config.paths.migrations })

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    })

    const address = fastify.server.address()
    const port = typeof address === 'string' ? address : address?.port
    if (port !== undefined) {
      console.log(`Server is running on port ${port}`)
    } else {
      console.log(`Server is running, but address information is unavailable.`)
    }
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
