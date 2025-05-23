import { FastifyInstance } from "fastify";
import { usersTable } from "@/modules/database/schema/users.schema";
import { teamMembersTable } from "@/modules/database/schema/teamMembers.schema";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import db from "@/modules/database";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/utils/password";
import { deleteSessionToken, saveSessionData, updateSessionDataOnly } from "@/utils/cookie";
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
                const sessionPayload = {
                    userId: userResponse.userId,
                    username: userResponse.username,
                    email: userResponse.email,
                    role: userResponse.role,
                    teamRole: {} // Empty map since new users don't belong to any team
                };
                const generatedSession = await saveSessionData(sessionPayload, sessionId);
                if (!generatedSession) {
                    return reply.status(500).send({ message: "Internal server error" });
                }

                reply.setCookie("session", sessionId, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                    path: '/',
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
                    createdAt: z.string(),
                    teamRole: z.record(z.string())
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

            // Fetch user's team roles
            const userTeamRoles = await fetchUserTeamRoles(user.id);

            const sessionPayload = {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                teamRole: userTeamRoles
            }

            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return reply.status(401).send({ message: "Invalid password" });
            }

            const sessionId = uuidv4();
            const generatedSession = await saveSessionData(sessionPayload, sessionId);
            if (!generatedSession) {
                return reply.status(500).send({ message: "Internal server error" });
            }
            // TODO: Change Cookie settings for production
            reply.setCookie("session", sessionId, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: '/',
                maxAge: config.jwt.expiresIn
            });

            return reply.status(200).send({
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt.toISOString(),
                teamRole: userTeamRoles
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
                    teamRole: z.record(z.string())
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
            const { userId } = request.CurrentUser;
            const user = await db.query.usersTable.findFirst({
                where: eq(usersTable.id, userId)
            });
            if (!user) {
                // Session exists but user doesn't? Clear cookie and session.
                const sessionId = request.cookies.session;
                if (sessionId) {
                    await deleteSessionToken(sessionId);
                    reply.clearCookie("session");
                }
                return reply.status(400).send({ message: "User associated with session not found" });
            }

            // Fetch user's team roles
            const userTeamRoles = await fetchUserTeamRoles(user.id);

            // Compare DB data with session data
            const currentUserData = request.CurrentUser;
            const dbUserData = {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                teamRole: userTeamRoles
            };

            const needsUpdate = dbUserData.username !== currentUserData.username ||
                               dbUserData.email !== currentUserData.email ||
                               dbUserData.role !== currentUserData.role || 
                               dbUserData.teamRole !== currentUserData.teamRole;

            if (needsUpdate) {
                const sessionId = request.cookies.session;
                if (sessionId) {
                    try {
                         // Update session data in Redis
                        await updateSessionDataOnly(dbUserData, sessionId);
                    } catch (error) {
                        console.error("Error updating session token:", error);
                        // Don't fail the request, but log the error
                    }
                } else {
                     // Should not happen if authenticate preHandler passed, but handle defensively
                     console.error("/me route: Session ID cookie missing after successful authentication.");
                }
            }

            // Always return the fresh data from the database
            return reply.status(200).send({
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                teamRole: userTeamRoles
            })
        }
    })
}

// Helper function to fetch user's team roles
async function fetchUserTeamRoles(userId: string): Promise<Record<string, string>> {
    try {
        // Fetch teams the user belongs to along with their roles
        const userTeams = await db.query.teamMembersTable.findMany({
            where: eq(teamMembersTable.userId, userId),
            columns: {
                teamId: true,
                role: true
            }
        });

        // Convert to a map of teamId -> role
        const teamRoleMap: Record<string, string> = {};
        userTeams.forEach(team => {
            teamRoleMap[team.teamId] = team.role;
        });

        return teamRoleMap;
    } catch (error) {
        console.error("Error fetching user team roles:", error);
        return {}; // Return empty object if there's an error
    }
}