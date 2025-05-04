import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/lib/db/index"; // your drizzle instance
import { openAPI, organization, username } from "better-auth/plugins";
 
export const auth = betterAuth({
    basePath: "/auth",
    plugins: [
        openAPI(),
        username(),
        organization(),
    ],
    database: drizzleAdapter(db, {
        provider: "pg", 
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    // Add email provider and email verification
});