import db from "@/lib/db";
import { z } from "zod";
import { author, authorSocials } from "@/lib/db/schema/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  createAuthorRequestSchema,
  updateAuthorRequestSchema,
  validate,
} from "@/lib/validation";

async function GET(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const authorId = searchParams.get("authorId");

  try {
    if (authorId) {
      // Fetch a specific author by ID
      const uuidSchema = z.string().uuid();
      const result = uuidSchema.safeParse(authorId);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid author ID format" },
          { status: 400 },
        );
      }

      const authorData = await db.query.author.findFirst({
        where: eq(author.id, authorId),
        with: {
          socials: true,
          titles: true,
        },
      });

      if (!authorData) {
        return NextResponse.json(
          { error: "Author not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ author: authorData });
    } else {
      // Fetch all authors with pagination
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");

      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: "Invalid pagination parameters" },
          { status: 400 },
        );
      }

      const offset = (page - 1) * limit;

      // Get total count for pagination metadata
      const totalCount = await db.select({ count: author.id }).from(author);
      const count = totalCount.length > 0 ? totalCount.length : 0;

      const authors = await db.query.author.findMany({
        limit,
        offset,
        with: {
          socials: true,
        },
        columns: {
            id: true,
            name: true,
            description: true,
        },
        orderBy: (author) => [author.name],
      });

      return NextResponse.json({
        authors,
        pagination: {
          page,
          limit,
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching author(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch author data" },
      { status: 500 },
    );
  }
}

async function POST(request: NextRequest, response: NextResponse) {
  try {
    const requestData = await request.json();

    // Validate request data
    const validation = validate(createAuthorRequestSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Create the author
    const now = new Date();
    const authorData = {
      name: data.name,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
    };

    const createdAuthors = await db
      .insert(author)
      .values(authorData)
      .returning();

    if (
      !createdAuthors ||
      !Array.isArray(createdAuthors) ||
      createdAuthors.length === 0
    ) {
      throw new Error("Failed to create author");
    }

    const createdAuthor = createdAuthors[0];

    // Create author socials if provided
    if (data.socials && data.socials.length > 0) {
      await db.insert(authorSocials).values(
        data.socials.map((social) => ({
          authorId: createdAuthor.id,
          type: social.type,
          url: social.url,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    // Fetch the created author with socials
    const fullAuthor = await db.query.author.findFirst({
      where: eq(author.id, createdAuthor.id),
      with: {
        socials: true,
      },
    });

    return NextResponse.json(
      {
        message: "Author created successfully",
        author: fullAuthor,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating author:", error);
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 },
    );
  }
}

async function PATCH(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const authorId = searchParams.get("authorId");

  if (!authorId) {
    return NextResponse.json(
      { error: "Author ID is required" },
      { status: 400 },
    );
  }

  // Validate author ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(authorId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid author ID format" },
      { status: 400 },
    );
  }

  try {
    // First check if the author exists
    const existingAuthor = await db.query.author.findFirst({
      where: eq(author.id, authorId),
      with: {
        socials: true,
      },
    });

    if (!existingAuthor) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Validate the update data
    const requestData = await request.json();
    const validation = validate(updateAuthorRequestSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };

    // Build the author updates
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;

    // Update the author if there are any fields to update
    if (Object.keys(updates).length > 1) {
      // > 1 because updatedAt is always included
      await db.update(author).set(updates).where(eq(author.id, authorId));
    }

    // Handle socials updates if provided
    if (data.socials && data.socials.length > 0) {
      // Get existing social IDs to compare
      const existingSocialIds = existingAuthor.socials.map(
        (social) => social.id,
      );

      for (const social of data.socials) {
        if (social.id) {
          // Update existing social
          if (existingSocialIds.includes(social.id)) {
            await db
              .update(authorSocials)
              .set({
                type: social.type,
                url: social.url,
                updatedAt: now,
              })
              .where(eq(authorSocials.id, social.id));
          }
        }
      }
    }

    // Handle social additions
    if (data.addSocials && data.addSocials.length > 0) {
      await db.insert(authorSocials).values(
        data.addSocials.map((social) => ({
          authorId: authorId,
          type: social.type,
          url: social.url,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    // Handle social removals
    if (data.removeSocials && data.removeSocials.length > 0) {
      await db
        .delete(authorSocials)
        .where(
          and(
            eq(authorSocials.authorId, authorId),
            inArray(authorSocials.id, data.removeSocials),
          ),
        );
    }

    // Fetch the updated author to return
    const updatedAuthor = await db.query.author.findFirst({
      where: eq(author.id, authorId),
      with: {
        socials: true,
        titles: true,
      },
    });

    return NextResponse.json({
      message: "Author updated successfully",
      author: updatedAuthor,
    });
  } catch (error) {
    console.error("Error updating author:", error);
    return NextResponse.json(
      { error: "Failed to update author" },
      { status: 500 },
    );
  }
}

async function DELETE(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const authorId = searchParams.get("authorId");

  if (!authorId) {
    return NextResponse.json(
      { error: "Author ID is required" },
      { status: 400 },
    );
  }

  // Validate author ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(authorId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid author ID format" },
      { status: 400 },
    );
  }

  try {
    // Check if the author exists
    const existingAuthor = await db.query.author.findFirst({
      where: eq(author.id, authorId),
      with: {
        titles: true,
      },
    });

    if (!existingAuthor) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Check if author has titles before deleting
    if (existingAuthor.titles && existingAuthor.titles.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete author with associated titles. Remove titles first.",
        },
        { status: 400 },
      );
    }

    // Delete the author - related socials will be deleted via cascade
    await db.delete(author).where(eq(author.id, authorId));

    return NextResponse.json(
      {
        message: "Author deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting author:", error);
    return NextResponse.json(
      { error: "Failed to delete author" },
      { status: 500 },
    );
  }
}

export { GET, POST, PATCH, DELETE };
