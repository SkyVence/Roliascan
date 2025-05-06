import db from "@/lib/db";
import { z } from "zod";
import { title, titleLinks, titleToGenre, titleStatus, titleType } from "@/lib/db/schema/schema";
import { eq, and, inArray, sql, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  createTitleRequestSchema,
  updateTitleRequestSchema,
  validate,
} from "@/lib/validation";

async function GET(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const titleId = searchParams.get("titleId");

  try {
    if (titleId) {
      // Fetch a specific title by ID
      const uuidSchema = z.string().uuid();
      const result = uuidSchema.safeParse(titleId);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid title ID format" },
          { status: 400 },
        );
      }
      const titleData = await db.query.title.findFirst({
        where: eq(title.id, titleId),
        with: {
          author: true,
          links: true,
          genres: {
            with: {
              genre: true,
            },
          },
          chapters: true,
        },
      });

      if (!titleData) {
        return NextResponse.json({ error: "Title not found" }, { status: 404 });
      }

      return NextResponse.json({ title: titleData });
    } else {
      // Fetch all titles with pagination
      try {
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        if (
          isNaN(page) ||
          page < 1 ||
          isNaN(limit) ||
          limit < 1 ||
          limit > 100
        ) {
          return NextResponse.json(
            { error: "Invalid pagination parameters" },
            { status: 400 },
          );
        }

        const offset = (page - 1) * limit;

        // First attempt to get titles with proper pagination
        console.log("Fetching titles...");
        let titles: any[] = [];
        try {
          titles = await db.query.title.findMany({
            limit,
            offset,
            with: {
              author: true,
            },
            orderBy: (title) => [title.updatedAt, { direction: "desc" }],
          });
          console.log("Titles query succeeded, got", titles.length, "results");
        } catch (titlesError) {
          console.error("Error fetching titles:", titlesError);
          // Fallback to a simpler query without relations if the main query fails
          try {
            const simpleResults = await db
              .select()
              .from(title)
              .limit(limit)
              .offset(offset);
            titles = simpleResults || [];
            console.log(
              "Simple fallback query succeeded, got",
              titles.length,
              "results",
            );
          } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            // Continue with empty titles if both queries fail
          }
        }

        // Get count of total items for pagination
        let count = 0;
        try {
          const allTitles = await db.select({ id: title.id }).from(title);
          count = allTitles?.length || 0;
          console.log("Count query succeeded, count =", count);
        } catch (countError) {
          console.error("Error getting count:", countError);
          // Continue with count = 0 if query fails
        }

        // Return results with pagination
        return NextResponse.json({
          titles,
          pagination: {
            page,
            limit,
            totalItems: count,
            totalPages: Math.max(1, Math.ceil(count / limit)),
          },
        });
      } catch (paginationError) {
        console.error("Overall pagination error:", paginationError);
        return NextResponse.json(
          { error: "Failed to execute pagination query" },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error fetching title(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch title data" },
      { status: 500 },
    );
  }
}

async function POST(request: NextRequest, response: NextResponse) {
  try {
    const requestData = await request.json();

    //Use the generic validation function with any schema
    const validation = validate(createTitleRequestSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Create the title
    const now = new Date();
    const titleData = {
      name: data.name,
      description: data.description || null,
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
      status: data.status,
      type: data.type,
    };

    const createdTitles = await db.insert(title).values(titleData).returning();

    if (
      !createdTitles ||
      !Array.isArray(createdTitles) ||
      createdTitles.length === 0
    ) {
      throw new Error("Failed to create title");
    }

    const createdTitle = createdTitles[0];

    // Create title links
    if (data.links && data.links.length > 0) {
      await db.insert(titleLinks).values(
        data.links.map((link) => ({
          titleId: createdTitle.id,
          name: link.name,
          url: link.url,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    // Create genre relationships
    if (data.genres && data.genres.length > 0) {
      await db.insert(titleToGenre).values(
        data.genres.map((genreId) => ({
          titleId: createdTitle.id,
          genreId: genreId,
        })),
      );
    }

    return NextResponse.json(
      {
        message: "Title created successfully",
        title: createdTitle,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating title:", error);
    return NextResponse.json(
      { error: "Failed to create title" },
      { status: 500 },
    );
  }
}

async function PATCH(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const titleId = searchParams.get("titleId");

  if (!titleId) {
    return NextResponse.json(
      { error: "Title ID is required" },
      { status: 400 },
    );
  }

  // Validate title ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(titleId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid title ID format" },
      { status: 400 },
    );
  }

  try {
    // First check if the title exists
    const existingTitle = await db.query.title.findFirst({
      where: eq(title.id, titleId),
      with: {
        links: true,
        genres: true,
      },
    });

    if (!existingTitle) {
      return NextResponse.json({ error: "Title not found" }, { status: 404 });
    }

    // Validate the update data
    const requestData = await request.json();
    const validation = validate(updateTitleRequestSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };

    // Build the title updates
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.authorId !== undefined) updates.authorId = data.authorId;

    // Update the title if there are any fields to update
    if (Object.keys(updates).length > 1) {
      // > 1 because updatedAt is always included
      await db.update(title).set(updates).where(eq(title.id, titleId));
    }

    // Handle links updates if provided
    if (data.links && data.links.length > 0) {
      // Get existing link IDs to compare
      const existingLinkIds = existingTitle.links.map((link) => link.id);

      for (const link of data.links) {
        if (link.id) {
          // Update existing link
          if (existingLinkIds.includes(link.id)) {
            await db
              .update(titleLinks)
              .set({
                name: link.name,
                url: link.url,
                updatedAt: now,
              })
              .where(eq(titleLinks.id, link.id));
          }
        } else {
          // Create new link
          await db.insert(titleLinks).values({
            titleId: titleId,
            name: link.name,
            url: link.url,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // Handle genre additions
    if (data.addGenres && data.addGenres.length > 0) {
      // Get existing genre IDs to avoid duplicates
      const existingGenreIds = existingTitle.genres.map((g) => g.genreId);

      // Filter out genres that already exist
      const newGenreIds = data.addGenres.filter(
        (id) => !existingGenreIds.includes(id),
      );

      if (newGenreIds.length > 0) {
        // Add new genre relationships
        await db.insert(titleToGenre).values(
          newGenreIds.map((genreId) => ({
            titleId: titleId,
            genreId: genreId,
          })),
        );
      }
    }

    // Handle genre removals
    if (data.removeGenres && data.removeGenres.length > 0) {
      await db
        .delete(titleToGenre)
        .where(
          and(
            eq(titleToGenre.titleId, titleId),
            inArray(titleToGenre.genreId, data.removeGenres),
          ),
        );
    }

    // Fetch the updated title to return
    const updatedTitle = await db.query.title.findFirst({
      where: eq(title.id, titleId),
      with: {
        author: true,
        links: true,
        genres: {
          with: {
            genre: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Title updated successfully",
      title: updatedTitle,
    });
  } catch (error) {
    console.error("Error updating title:", error);
    return NextResponse.json(
      { error: "Failed to update title" },
      { status: 500 },
    );
  }
}

async function DELETE(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const titleId = searchParams.get("titleId");

  if (!titleId) {
    return NextResponse.json(
      { error: "Title ID is required" },
      { status: 400 },
    );
  }

  // Validate title ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(titleId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid title ID format" },
      { status: 400 },
    );
  }

  try {
    // Check if the title exists
    const existingTitle = await db.query.title.findFirst({
      where: eq(title.id, titleId),
    });

    if (!existingTitle) {
      return NextResponse.json({ error: "Title not found" }, { status: 404 });
    }

    // Delete the title - related records will be deleted via cascade
    await db.delete(title).where(eq(title.id, titleId));

    return NextResponse.json(
      {
        message: "Title deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting title:", error);
    return NextResponse.json(
      { error: "Failed to delete title" },
      { status: 500 },
    );
  }
}

export { GET, POST, PATCH, DELETE };
