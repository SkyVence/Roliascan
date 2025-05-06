import { z } from "zod";
import { CreateTitleRequest } from "@/types/request";

// Title validation schemas
export const createTitleRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  authorId: z.string().uuid(),
  status: z.enum(["ongoing", "completed", "cancelled", "hiatus"]).optional(),
  type: z.enum(["manga", "manhwa", "manhua", "comic", "other"]).optional(),
  links: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().url(),
    }),
  ),
  genres: z.array(z.string().uuid()),
});

// Update title schema - all fields are optional for PATCH operations
export const updateTitleRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  authorId: z.string().uuid().optional(),
  status: z.enum(["ongoing", "completed", "cancelled", "hiatus"]).optional(),
  type: z.enum(["manga", "manhwa", "manhua", "comic", "other"]).optional(),
  links: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // Existing link ID if updating
        name: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .optional(),
  addGenres: z.array(z.string().uuid()).optional(),
  removeGenres: z.array(z.string().uuid()).optional(),
});

// Author validation schemas
export const createAuthorRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  socials: z
    .array(
      z.object({
        type: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .optional(),
});

export const updateAuthorRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  socials: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // For existing socials
        type: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .optional(),
  addSocials: z
    .array(
      z.object({
        type: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .optional(),
  removeSocials: z.array(z.string().uuid()).optional(), // Array of social IDs to remove
});

// Chapter validation schemas
export const createChapterRequestSchema = z.object({
  name: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  titleId: z.string().uuid(),
  uploadedBy: z.string(), // User ID
  content: z
    .array(
      z.object({
        displayOrder: z.number().int().nonnegative(),
        url: z.string().url(),
        key: z.string().min(1),
      }),
    )
    .min(1),
});

export const updateChapterRequestSchema = z.object({
  name: z.string().min(1).optional(),
  chapterNumber: z.number().int().positive().optional(),
  content: z
    .array(
      z.object({
        id: z.string().uuid().optional(), // For existing content
        displayOrder: z.number().int().nonnegative(),
        url: z.string().url(),
        key: z.string().min(1),
      }),
    )
    .optional(),
  addContent: z
    .array(
      z.object({
        displayOrder: z.number().int().nonnegative(),
        url: z.string().url(),
        key: z.string().min(1),
      }),
    )
    .optional(),
  removeContent: z.array(z.string().uuid()).optional(), // Array of content IDs to remove
});

/**
 * Generic validation function that can validate data against any Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns Object with success flag and either validated data or error
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
):
  | { success: true; data: z.infer<T>; error?: never }
  | { success: false; error: z.ZodFormattedError<any>; data?: never } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as z.infer<T> };
  } else {
    return { success: false, error: result.error.format() };
  }
}

/**
 * Validates a create title request
 * @param data The data to validate
 * @returns Object with success flag and either validated data or error
 */
export function validateCreateTitleRequest(
  data: unknown,
):
  | { success: true; data: CreateTitleRequest; error?: never }
  | { success: false; error: z.ZodFormattedError<any>; data?: never } {
  return validate(createTitleRequestSchema, data);
}
