import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/lib/db/index"; // your drizzle instance
import { admin, openAPI, organization, username } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "OpenMediaScan",
  basePath: "/auth",
  plugins: [openAPI(), organization(), admin(), username()],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // TODO: Add email verification Config
  },
  user: {
    changeEmail: {
        enabled: true,
        // TODO: Add email verification
    },
    deleteUser: {
        enabled: true,
    }
  },
  cors: {
    enabled: true,
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL,
    credentials: true,
  },
  trustedOrigins: ["http://localhost:3001"],
});