import { FastifyInstance } from "fastify";
import { usersTable } from "@/modules/database/schema/users.schema";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import db from "@/modules/database";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/utils/password";
import { deleteSessionToken, generateSessionToken } from "@/utils/cookie";
import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";


export async function AuthController(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/register',
        schema: {
            body: z.object({
                username: z.string().min(3),
                email: z.string().min(1),
                password: z.string().min(8)
            }),
            response: {
                200: z.object({
                    userId: z.string(),
                    username: z.string(),
                    email: z.string().email(),
                    role: z.string(),
                    createdAt: z.string(),
                }),
                400: z.object({
                    message: z.string()
                }),
                500: z.object({
                    message: z.string()
                })
            }
        },
        handler: async (request, reply) => {
            const { username, email, password } = request.body;

            try {
                // Check if email exists
                const findUserByEmail = await db.query.usersTable.findFirst({
                    where: eq(usersTable.email, email)
                });
                if (findUserByEmail) {
                    return reply.status(400).send({ message: "Email already in use" });
                }

                // Check if username exists
                const findUserByUsername = await db.query.usersTable.findFirst({
                    where: eq(usersTable.username, username)
                });
                if (findUserByUsername) {
                    return reply.status(400).send({ message: "Username already in use" });
                }

                // Hash password
                const hashedPassword = await hashPassword(password);

                // Insert user
                const user = await db.insert(usersTable).values({
                    username,
                    email,
                    password: hashedPassword
                }).returning({
                    userId: usersTable.id,
                    username: usersTable.username,
                    email: usersTable.email,
                    role: usersTable.role,
                    createdAt: usersTable.createdAt
                });
                const userResponse = user[0];

                const sessionId = uuidv4();
                const generatedSession = await generateSessionToken(userResponse, sessionId);
                if (!generatedSession) {
                    return reply.status(500).send({ message: "Internal server error" });
                }

                reply.setCookie("session", sessionId, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: config.jwt.expiresIn
                });
                return reply.status(200).send({
                    userId: userResponse.userId,
                    username: userResponse.username,
                    email: userResponse.email,
                    role: userResponse.role,
                    createdAt: userResponse.createdAt.toISOString()
                });
            } catch (error) {
                console.error("Registration error:", error); // Log the actual error
                return reply.status(500).send({ message: "Internal server error" });
            }
        }
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
            body: z.union([
                z.object({
                    email: z.string().email(),
                    password: z.string().min(8),
                }),
                z.object({
                    username: z.string().min(3),
                    password: z.string().min(8)
                })
            ]),
            response: {
                200: z.object({
                    userId: z.string(),
                    username: z.string(),
                    email: z.string().email(),
                    role: z.string(),
                    createdAt: z.string()
                }),
                401: z.object({
                    message: z.string()
                }),
                400: z.object({
                    message: z.string()
                }),
                500: z.object({
                    message: z.string()
                })
            }
        },
        handler: async (request, reply) => {
            const { password } = request.body;
            let identifier: string;
            let user;

            if ('email' in request.body) {
                identifier = request.body.email;
                user = await db.query.usersTable.findFirst({
                    where: eq(usersTable.email, identifier)
                });
            } else if ('username' in request.body) {
                identifier = request.body.username;

                 user = await db.query.usersTable.findFirst({
                    where: eq(usersTable.username, identifier)
                });
            } else {
                 return reply.status(400).send({ message: "Invalid login credentials format" });
            }

            if (!user) {
                return reply.status(401).send({ message: "Invalid username or email is incorrect" });
            }

            const sessionPayload = {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }

            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return reply.status(401).send({ message: "Invalid password" });
            }

            const sessionId = uuidv4();
            const generatedSession = await generateSessionToken(sessionPayload, sessionId);
            if (!generatedSession) {
                return reply.status(500).send({ message: "Internal server error" });
            }

            reply.setCookie("session", sessionId, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: config.jwt.expiresIn
            });

            return reply.status(200).send({
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt.toISOString() 
            })
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/logout',
        onRequest: fastify.authenticate,
        handler: async (request, reply) => {
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ message: "Unauthorized" });
            }
            await deleteSessionToken(sessionId);
            reply.clearCookie("session");
            return reply.status(200).send({ message: "Logged out successfully" });
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/me',
        schema: {
            response: {
                200: z.object({
                    userId: z.string(),
                    username: z.string(),
                    email: z.string().email(),
                    role: z.string(),
                }),
                400: z.object({
                    message: z.string()
                }),
                500: z.object({
                    message: z.string()
                })
            }
        },
        preHandler: fastify.authenticate,
        handler: async (request, reply) => {
            const user = request.CurrentUser;
            return reply.status(200).send({
                userId: user.userId,
                username: user.username,
                email: user.email,
                role: user.role,
            })
        }
    })
}