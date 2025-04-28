import db from "@/modules/database";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { eq, or } from "drizzle-orm";
import { NewTitle, titlesTable } from "@/modules/database/schema/titles.schema";
import { z } from "zod";


export async function TitlesController(fastify: FastifyInstance) {
    // Get all titles
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/titles',
        handler: async (request, reply) => {
            const titles = await db.query.titlesTable.findMany();
            return reply.status(200).send({ titles });
        }
    })
    // Get title by name or slug
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/titles/:nameOrSlug',
        schema: {
            params: z.object({
                nameOrSlug: z.string()
            })
        },
        handler: async (request, reply) => {
            const { nameOrSlug } = request.params;
            const title = await db.query.titlesTable.findFirst({
                where: or(eq(titlesTable.title, nameOrSlug), eq(titlesTable.slug, nameOrSlug))
            });
            if (!title) {
                return reply.status(404).send({ message: "Title not found" });
            }
            return reply.status(200).send({ title });
        }
    })
    // Create title
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/titles',
        schema: {
            body: z.object({
                title: z.string().min(3),
                slug: z.string().min(3),
                description: z.string().min(3),
                authorId: z.string().uuid(),
                year: z.number(),
                status: z.enum(['ongoing', 'completed', 'cancelled']).optional(),
                type: z.enum(['manga', 'manhwa', 'manhua', 'comic', 'other']).optional(),
                chapterCount: z.number().optional().default(0),
                volumeCount: z.number().optional().default(0),
            })
        },
        preHandler: [fastify.authenticate, fastify.hasPermission("owner", "admin")],
        handler: async (request, reply) => {
            const { title, slug, description, authorId, year, status, type, chapterCount, volumeCount } = request.body;
            const newTitle: NewTitle = {
                title,
                slug,
                description,
                authorId,
                uploaderId: request.CurrentUser.userId,
                year,
                status,
                type,
                chapterCount,
                volumeCount,
            }
            const titleCreated = await db.insert(titlesTable).values(newTitle).returning({ titleId: titlesTable.id, titleName: titlesTable.title });
            if (!titleCreated) {
                return reply.status(500).send({ message: "Failed to create title" });
            }
            return reply.status(200).send({ titleCreated });
        }
    })
    // Update title
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'PATCH',
        url: '/titles/:id',
        schema: {
            params: z.object({
                id: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(3).optional(),
                slug: z.string().min(3).optional(),
                description: z.string().min(3).optional(),
                authorId: z.string().uuid().optional(),
                year: z.number().optional(),
                status: z.enum(['ongoing', 'completed', 'cancelled']).optional(),
                type: z.enum(['manga', 'manhwa', 'manhua', 'comic', 'other']).optional(),
                chapterCount: z.number().optional(),
                volumeCount: z.number().optional(),
            })
        },
        preHandler: [fastify.authenticate, fastify.hasPermission("owner", "admin")],
        handler: async (request, reply) => {
            const { id } = request.params;

            const searchTitle = await db.query.titlesTable.findFirst({
                where: eq(titlesTable.id, id)
            });
            if (!searchTitle) {
                return reply.status(404).send({ message: "Title not found" });
            }

            const { title, slug, description, authorId, year, status, type, chapterCount, volumeCount } = request.body;
            const titleUpdated = await db.update(titlesTable).set({ title, slug, description, authorId, year, status, type, chapterCount, volumeCount }).where(eq(titlesTable.id, id));
            return reply.status(200).send({ titleUpdated });
        }
    })
    // Delete title
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/titles/:id',
        schema: {
            params: z.object({
                id: z.string().uuid(),
            })
        },
        preHandler: [fastify.authenticate, fastify.hasPermission("owner", "admin")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const titleDeleted = await db.delete(titlesTable).where(eq(titlesTable.id, id));
            return reply.status(200).send({ titleDeleted });
        }
    })
}