import { z } from "zod";

const createTitleRequestSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    authorId: z.string().uuid(),
    links: z.array(z.object({
        name: z.string().min(1),
        url: z.string().url(),
    })),
    genres: z.array(z.string().uuid()),
});

export type CreateTitleRequest = z.infer<typeof createTitleRequestSchema>;