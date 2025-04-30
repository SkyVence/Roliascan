import db from "@/modules/database";
import { titlesTable, NewTitle } from "@/modules/database/schema/titles.schema";
import { eq } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function TitleController(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().get("/title", {
        schema: {
            tags: ["title"],
            summary: "Get all titles",
            description: "Get all titles",
            response: {
                200: z.array(z.object({
                    id: z.string(),
                    title: z.string(),
                    slug: z.string(),
                    description: z.string(),
                    status: z.string(),
                    type: z.string(),
                    year: z.number(),
                    chapterCount: z.number(),
                    volumeCount: z.number(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                    team: z.object({
                        id: z.string(),
                        name: z.string(),
                    }), 
                    author: z.object({
                        id: z.string(),
                        name: z.string(),
                    }),
                    uploader: z.object({
                        id: z.string(),
                        username: z.string(),
                    }),
                })),
            },
        },
        handler: async (request, reply) => {
            const titles = await db.query.titlesTable.findMany({
                with: {
                    team: {
                        columns: {
                            id: true,
                            name: true,
                        }
                    },
                    author: {
                        columns: {
                            id: true,
                            name: true,
                        }
                    },
                    uploader: {
                        columns: {
                            id: true,
                            username: true,
                        }
                    },
                    
                }
            })

            const formattedTitles = titles.map((title) => ({
                id: title.id,
                title: title.title,
                slug: title.slug,
                description: title.description || "",
                status: title.status,
                type: title.type,
                year: title.year,
                chapterCount: title.chapterCount,
                volumeCount: title.volumeCount,
                createdAt: title.createdAt.toISOString(),
                updatedAt: title.updatedAt.toISOString(),
                team: {
                    id: title.team?.id || "",
                    name: title.team?.name || "",
                },
                author: {
                    id: title.author.id,
                    name: title.author.name,
                },
                uploader: {
                    id: title.uploader.id,
                    username: title.uploader.username,
                },
            }));
            return reply.status(200).send(formattedTitles);
        },
    });
    fastify.withTypeProvider<ZodTypeProvider>().get("/title/:id", {
        schema: {
            tags: ["title"],
            summary: "Get a title by ID",
            description: "Get a title by ID",
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.string(),
                    title: z.string(),
                    slug: z.string(),
                    description: z.string(),
                    status: z.string(),
                    type: z.string(),
                    year: z.number(),
                    chapterCount: z.number(),
                    volumeCount: z.number(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                    team: z.object({
                        id: z.string(),
                        name: z.string(),
                    }), 
                    author: z.object({
                        id: z.string(),
                        name: z.string(),
                    }),
                    uploader: z.object({
                        id: z.string(),
                        username: z.string(),
                    })
                }),
                404: z.object({
                    message: z.string(),
                }),
                500: z.object({
                    message: z.string(),
                })
            },
        },
        handler: async (request, reply) => {
            const { id } = request.params;
            const title = await db.query.titlesTable.findFirst({
                where: eq(titlesTable.id, id),
                with: {
                    team: {
                        columns: {
                            id: true,
                            name: true,
                        }
                    },
                    author: {
                        columns: {
                            id: true,
                            name: true,
                        }
                    },
                    uploader: {
                        columns: {
                            id: true,
                            username: true,
                        }
                    },
                },
            });
            if (!title) {
                return reply.status(404).send({ message: "Title not found" });
            }

            const formattedTitles = {
                id: title.id,
                title: title.title,
                slug: title.slug,
                description: title.description || "",
                status: title.status,
                type: title.type,
                year: title.year,
                chapterCount: title.chapterCount,
                volumeCount: title.volumeCount,
                createdAt: title.createdAt.toISOString(),
                updatedAt: title.updatedAt.toISOString(),
                team: {
                    id: title.team?.id || "",
                    name: title.team?.name || "",
                },
                author: {
                    id: title.author.id,
                    name: title.author.name,
                },
                uploader: {
                    id: title.uploader.id,
                    username: title.uploader.username,
                },
            };
            return reply.status(200).send(formattedTitles);
        }
    });
    fastify.withTypeProvider<ZodTypeProvider>().post("/title", {
        schema: {
            tags: ["title"],
            summary: "Create a new title",
            description: "Create a new title with the provided details",
            body: z.object({
                title: z.string().min(3),
                slug: z.string().min(3),
                description: z.string(),
                status: z.enum(["ongoing", "completed", "cancelled", "hiatus"]),
                type: z.enum(["manga", "manhwa", "manhua", "comic", "other"]),
                year: z.number(),
                chapterCount: z.number(),
                volumeCount: z.number(),
                authorId: z.string().uuid(),
                uploaderId: z.string().uuid(),
                teamId: z.string().optional(), // Optional because it's not required for the user to be in a team
            }),
            response: {
                200: z.object({
                    message: z.string(),
                    titleId: z.string(),
                    teamId: z.string().optional(), // Optional because it's not required for the user to be in a team
                }),
                400: z.object({
                    message: z.string(),
                }),
                500: z.object({
                    message: z.string(),
                })
            },
        },
        preHandler: [fastify.authenticate, fastify.hasRole("admin")],
        handler: async (request, reply) => {
            const { title, slug, description, status, type, year, chapterCount, volumeCount, authorId, uploaderId, teamId } = request.body;
            
            try {
                // Insert the new title
                const result = await db.insert(titlesTable).values({
                    title,
                    slug,
                    description,
                    status,
                    type,
                    year,
                    chapterCount,
                    volumeCount,
                    authorId,
                    uploaderId,
                    teamId,
                }).returning();

                if (!result || result.length === 0) {
                    return reply.status(500).send({ message: "Failed to create title" });
                }

                return reply.status(200).send({
                    message: "Title created successfully",
                    titleId: result[0].id,
                    teamId: result[0].teamId || undefined,
                });
            } catch (error) {
                console.error("Error creating title:", error);
                return reply.status(500).send({ message: "Error creating title" });
            }
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().patch("/title/:id", {
        schema: {
            tags: ["title"],
            summary: "Update a title",
            description: "Update a title with the provided details",
            params: z.object({
                id: z.string(),
            }),
            body: z.object({
                title: z.string().min(3).optional(),
                slug: z.string().min(3).optional(),
                description: z.string().optional(),
                status: z.enum(["ongoing", "completed", "cancelled", "hiatus"]).optional(),
                type: z.enum(["manga", "manhwa", "manhua", "comic", "other"]).optional(),
                year: z.number().optional(),
                chapterCount: z.number().optional(),
                volumeCount: z.number().optional(),
                authorId: z.string().uuid().optional(),
                uploaderId: z.string().uuid().optional(),
                teamId: z.string().optional(), // Optional because it's not required for the user to be in a team
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
            const { title, slug, description, status, type, year, chapterCount, volumeCount, authorId, uploaderId, teamId } = request.body;
            try {
                const result = await db.update(titlesTable).set({
                    title,
                    slug,
                    description,
                }).where(eq(titlesTable.id, id)).returning();
                if (!result || result.length === 0) {
                    return reply.status(500).send({ message: "Failed to update title" });
                }
                return reply.status(200).send({
                    message: "Title updated successfully",
                });
            } catch (error) {
                return reply.status(500).send({ message: "Error updating title" });
            }
        }
    });
    fastify.withTypeProvider<ZodTypeProvider>().delete("/title/:id", {
        schema: {
            tags: ["title"],
            summary: "Delete a title",
            description: "Delete a title with the provided details",
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
                const result = await db.delete(titlesTable).where(eq(titlesTable.id, id)).returning();
                if (!result || result.length === 0) {
                    return reply.status(500).send({ message: "Failed to delete title" });
                }
                return reply.status(200).send({
                    message: "Title deleted successfully",
                });
            } catch (error) {
                return reply.status(500).send({ message: "Error deleting title" });
            }
        }
    });
}