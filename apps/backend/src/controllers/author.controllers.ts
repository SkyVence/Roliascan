import db from "@/modules/database";
import { authorsTable } from "@/modules/database/schema";
import { eq } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
export async function AuthorController(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().get("/authors", {
        schema: {
            tags: ["authors"],
            summary: "Get all authors",
            description: "Get all authors",
            response: {
                200: z.array(z.object({
                    id: z.string(),
                    name: z.string(),
                })),
            },
        },
        handler: async (request, reply) => {
            const authors = await db.query.authorsTable.findMany({
                columns: {
                    id: true,
                    name: true,
                }
            });
            return reply.status(200).send(authors);
        }
    });
    fastify.withTypeProvider<ZodTypeProvider>().get("/authors/:id", {
        schema: {
            tags: ["authors"],
            summary: "Get an author by ID",
            description: "Get an author by ID",
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                }),
                404: z.object({
                    message: z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { id } = request.params;
            const author = await db.query.authorsTable.findFirst({
                where: eq(authorsTable.id, id),
            });
            if (!author) {
                return reply.status(404).send({ message: "Author not found" });
            }
            return reply.status(200).send({
                id: author.id,
                name: author.name,
                description: author.description || "",
                createdAt: author.createdAt.toISOString(),
                updatedAt: author.updatedAt.toISOString(),
            });
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().post("/authors", {
        schema: {
            tags: ["authors"],
            summary: "Create an author",
            description: "Create an author",
            body: z.object({
                name: z.string(),
                description: z.string(),
            }),
            response: {
                200: z.object({
                    message: z.string(),
                    authorId: z.string(),
                }),
                400: z.object({
                    message: z.string(),
                }),
            }
        },
        preHandler: [fastify.authenticate, fastify.hasRole("admin")],
        handler: async (request, reply) =>{
            const { name, description } = request.body;
            try {
                const author = await db.insert(authorsTable).values({
                    name,
                    description,
                }).returning();
                if (!author) {
                    return reply.status(500).send({ message: "Failed to create author" });
                }
                return reply.status(200).send({
                    message: "Author created successfully",
                    authorId: author[0].id,
                });
            } catch (error) {
                return reply.status(500).send({ message: "Error creating author" });
            }
        }
    });
    fastify.withTypeProvider<ZodTypeProvider>().patch("/authors/:id", {
        schema: {
            tags: ["authors"],
            summary: "Update an author",
            description: "Update an author",
            params: z.object({
                id: z.string(),
            }),
            body: z.object({
                name: z.string().optional(),
                description: z.string().optional(),
            }),
            response: {
                200: z.object({
                    message: z.string(),
                }),
                400: z.object({
                    message: z.string(),
                }),
            }
        },
        preHandler: [fastify.authenticate, fastify.hasRole("admin")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const { name, description } = request.body;
            try {
                const author = await db.update(authorsTable).set({
                    name,
                    description,
                }).where(eq(authorsTable.id, id)).returning();
                if (!author) {
                    return reply.status(500).send({ message: "Failed to update author" });
                }
                return reply.status(200).send({
                    message: "Author updated successfully",
                });
            } catch (error) {
                return reply.status(500).send({ message: "Error updating author" });
            }
        }
    });
    fastify.withTypeProvider<ZodTypeProvider>().delete("/authors/:id", {
        schema: {
            tags: ["authors"],
            summary: "Delete an author",
            description: "Delete an author",
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({
                    message: z.string(),
                }),
                400: z.object({
                    message: z.string(),
                }),
            }
        },
        preHandler: [fastify.authenticate, fastify.hasRole("admin")],
        handler: async (request, reply) => {
            const { id } = request.params;
            try {
                const author = await db.delete(authorsTable).where(eq(authorsTable.id, id)).returning();
                if (!author) {
                    return reply.status(500).send({ message: "Failed to delete author" });
                }
                return reply.status(200).send({
                    message: "Author deleted successfully",
                });
            } catch (error) {
                return reply.status(500).send({ message: "Error deleting author" });
            }
        }
    });
}
