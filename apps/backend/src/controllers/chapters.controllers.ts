import db from "@/modules/database";
import { chaptersTable } from "@/modules/database/schema/chapters.schema";
import { eq } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function ChaptersController(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/chapters',
        schema: {
            querystring: z.object({
                titleId: z.string().uuid(),
            })
        },
        handler: async (request, reply) => {
            const { titleId } = request.query;
            const chapters = await db.query.chaptersTable.findFirst({
                where: eq(chaptersTable.titleId, titleId)
            });
            if (!chapters) {
                return reply.status(404).send({ message: "Chapters not found" });
            }
            return reply.status(200).send({ chapters });
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/chapters/:id',
        schema: {
            params: z.object({
                id: z.string().uuid(),
            })
        },
        preHandler: [fastify.authenticate, fastify.hasPermission("owner", "admin")],
        handler: async (request, reply) => {
            const { id } = request.params;
            const chapter = await db.query.chaptersTable.findFirst({
                where: eq(chaptersTable.id, id)
            });
            if (!chapter) {
                return reply.status(404).send({ message: "Chapter not found" });
            }
            return reply.status(200).send({ chapter });
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/chapters',
        schema: {
            querystring: z.object({
                titleId: z.string().uuid(),
            }),
            body: z.object({
                name: z.string().min(3),
                slug: z.string().min(3),
                chapterNumber: z.number(),
                volumeNumber: z.number(),
                pages: z.number(),
            })
        },
        preHandler: [fastify.authenticate, fastify.hasPermission("owner", "admin")],
        handler: async (request, reply) => {
            const { titleId } = request.query;
            const { name, slug, chapterNumber, volumeNumber, pages } = request.body;
            const newChapter = {
                name,
                slug,
                chapterNumber,
                volumeNumber,
                pages,
                titleId: titleId,
                uploaderId: request.CurrentUser.userId,
            };
            
            const result = await db.insert(chaptersTable).values(newChapter).returning();
            return reply.status(201).send({ chapter: result[0] });
        }
    })
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'PATCH',
        url: '/chapters',
        schema: {
            querystring: z.object({
                titleId: z.string().uuid(),
            }),
            body: z.object({
                id: z.string().uuid(),
                name: z.string().min(3).optional(),
                slug: z.string().min(3).optional(),
                chapterNumber: z.number().optional(),
                volumeNumber: z.number().optional(),
                pages: z.number().optional(),
            })
        },
        preHandler: [fastify.authenticate, fastify.hasPermission("owner", "admin")],
        handler: async (request, reply) => {
            const { titleId } = request.query;
            const { name, slug, chapterNumber, volumeNumber, pages, id } = request.body;
            const chapter = await db.query.chaptersTable.findFirst({
                where: eq(chaptersTable.id, id) && eq(chaptersTable.titleId, titleId)
            });
            if (!chapter) {
                return reply.status(404).send({ message: "Chapter not found" });
            }
            const updatedChapter = await db.update(chaptersTable).set({
                name,
                slug,
                chapterNumber,
                volumeNumber,
                pages,
            }).where(eq(chaptersTable.id, id) && eq(chaptersTable.titleId, titleId));
            return reply.status(200).send({ chapter: updatedChapter });
        }
    })
}