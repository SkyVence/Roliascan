import { env } from "./env"
import path from "path"
import { fileURLToPath } from "url"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, "../..")

// Define application config
export const config = {
  env,

  // Server
  server: {
    port: env.PORT,
    host: env.HOST,
    isDev: env.NODE_ENV === "development",
    isProd: env.NODE_ENV === "production",
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  // Database
  db: {
    url: env.DATABASE_URL,
  },

  // Paths
  paths: {
    root: rootDir,
    uploads: path.join(rootDir, env.UPLOAD_DIR),
    migrations: path.join(rootDir, "src/schemas/migrations"),
  },

  // Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    method: env.UPLOAD_METHOD,
    uploadthing: {
      secret: env.UPLOADTHING_SECRET,
      appId: env.UPLOADTHING_APP_ID,
    },
  },

  // Roles and permissions
  roles: {
    admin: "admin",
    moderator: "moderator",
    uploader: "uploader",
    user: "user",
  },

  // Role-based permissions
  rolePermissions: {
    admin: ["*"], // Admin can do everything
    moderator: ["create:content", "update:content", "create:chapter", "update:chapter", "delete:comment", "mute:user"],
    uploader: ["create:content", "update:content", "create:chapter", "update:chapter"],
    user: [], // Regular users have no special permissions
  },
}

export type Config = typeof config
