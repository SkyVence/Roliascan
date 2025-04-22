import { z } from "zod";
import { makeRouter } from "@/services/router";
import { handle } from "@/services/handler";
import { users } from "@/schemas";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/services/password";
import { generateJwtToken } from "@/services/jwt";

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const registerResponseSchema = z.object({
    sessionToken: z.string(),
});

export const manageAuthRoutes = makeRouter((app) => {
    app.post(
        '/auth/register',
        {
            schema: {
                body: userSchema,
                response: {
                    200: registerResponseSchema,
                    // TODO: Add error responses (e.g., 409 Conflict for existing user)
                },
            },
        },
        handle(async (ctx) => {
            const { email, password } = ctx.body;
            const { db } = ctx;

            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                throw new Error('User already exists');
            }

            // --- Placeholder Logic --- 

            const hashedPassword = await hashPassword(password);

            console.log(`Creating user: ${email}`);
            const newUser = await db.insert(users).values({ email, password: hashedPassword }).returning();

            // 4. Generate session token (e.g., JWT)
            // const sessionToken = generateJwt({ userId: newUser.id });
            const sessionToken = generateJwtToken(newUser.id, email); // Replace with actual token generation
            // --- End Placeholder Logic ---

            return { sessionToken };
        }),
    );
});