import { env } from "./env"

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

  // Database
  db: {
    url: env.DATABASE_URL,
  },

  // Redis
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
  },

}

export type Config = typeof config
