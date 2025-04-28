import db from "@/modules/database";
import { authorsTable } from "@/modules/database/schema/authors.schema";
import { eq } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function AuthorsController(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/authors',
        handler: async (request, reply) => {
            const authors = await db.query.authorsTable.findMany();
            return reply.status(200).send({ authors });
        }
    })
    // Get author by name or id
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/authors/:id',
        schema: {
            params: z.object({
                id: z.string().uuid(),
            })
        },
        handler: async (request, reply) => {
            const { id } = request.params;
            const author = await db.query.authorsTable.findFirst({
                where: eq(authorsTable.id, id)
            });
            if (!author) {
                return reply.status(404).send({ message: "Author not found" });
            }
            return reply.status(200).send({ author });
        }
    })
    // Create author
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/authors',
        schema: {
            body: z.object({
                name: z.string().min(3),
                description: z.string().min(3),
            })
        },
        handler: async (request, reply) => {
            const { name, description } = request.body;
            const author = await db.insert(authorsTable).values({ name, description }).returning({ id: authorsTable.id, name: authorsTable.name });
            return reply.status(200).send({ author });
        }
    })
    // Update author
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'PATCH',
        url: '/authors/:id',
        schema: {
            params: z.object({
                id: z.string().uuid(),
            }),
            body: z.object({
                name: z.string().min(3).optional(),
                description: z.string().min(3).optional(),
            })
        },
        handler: async (request, reply) => {
            const { id } = request.params;
            const { name, description } = request.body;
            const author = await db.update(authorsTable).set({ name, description }).where(eq(authorsTable.id, id)).returning({ id: authorsTable.id, name: authorsTable.name });
            return reply.status(200).send({ author });
        }
    })
    // Delete author
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/authors/:id',
        schema: {
            params: z.object({
                id: z.string().uuid(),
            })
        },
        handler: async (request, reply) => {
            const { id } = request.params;
            const author = await db.delete(authorsTable).where(eq(authorsTable.id, id));
            return reply.status(200).send({ author });
        }
    })
}