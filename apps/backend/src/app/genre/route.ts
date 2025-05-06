import db from "@/lib/db";
import { z } from "zod";
import { genre, titleToGenre } from "@/lib/db/schema/schema";
import { eq, and, inArray, sql, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Define validation schemas
const createGenreSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateGenreSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

// Validation helper function
function validate(schema: any, data: any) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

async function GET(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const genreId = searchParams.get("genreId");

  try {
    if (genreId) {
      // Fetch a specific genre by ID
      const uuidSchema = z.string().uuid();
      const result = uuidSchema.safeParse(genreId);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid genre ID format" },
          { status: 400 },
        );
      }
      const genreData = await db.query.genre.findFirst({
        where: eq(genre.id, genreId),
        with: {
          titles: {
            with: {
              title: true,
            },
          },
        },
      });

      if (!genreData) {
        return NextResponse.json({ error: "Genre not found" }, { status: 404 });
      }

      return NextResponse.json({ genre: genreData });
    } else {
      // Fetch all genres with pagination
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

        console.log("Fetching genres...");
        
        // Get genres with pagination - using a try/catch to handle potential errors
        let genres: any[] = [];
        try {
          genres = await db.select().from(genre).limit(limit).offset(offset);
          console.log("Genres query succeeded, got", genres.length, "results");
        } catch (genresError) {
          console.error("Error fetching genres:", genresError);
          // Continue with empty genres array
          genres = [];
        }

        // Get count of total items for pagination with safer handling
        let totalCount = 0;
        try {
          const countResult = await db.select({ value: count() }).from(genre);
          totalCount = countResult[0]?.value || 0;
          console.log("Count query succeeded, count =", totalCount);
        } catch (countError) {
          console.error("Error getting count:", countError);
          // Continue with count = 0
        }

        return NextResponse.json({
          genres,
          pagination: {
            page,
            limit,
            totalItems: totalCount,
            totalPages: Math.max(1, Math.ceil(totalCount / limit)),
          },
        });
      } catch (error) {
        console.error("Error in pagination:", error);
        return NextResponse.json(
          { error: "Failed to execute pagination query" },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error fetching genre(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch genre data" },
      { status: 500 },
    );
  }
}

async function POST(request: NextRequest, response: NextResponse) {
  try {
    const requestData = await request.json();
    const validation = validate(createGenreSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const now = new Date();
    
    const genreData = {
      name: data.name,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
    };

    const createdGenres = await db.insert(genre).values(genreData).returning();

    if (
      !createdGenres ||
      !Array.isArray(createdGenres) ||
      createdGenres.length === 0
    ) {
      throw new Error("Failed to create genre");
    }

    return NextResponse.json(
      {
        message: "Genre created successfully",
        genre: createdGenres[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating genre:", error);
    return NextResponse.json(
      { error: "Failed to create genre" },
      { status: 500 },
    );
  }
}

async function PATCH(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const genreId = searchParams.get("genreId");

  if (!genreId) {
    return NextResponse.json(
      { error: "Genre ID is required" },
      { status: 400 },
    );
  }

  // Validate genre ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(genreId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid genre ID format" },
      { status: 400 },
    );
  }

  try {
    // Check if the genre exists
    const existingGenre = await db.query.genre.findFirst({
      where: eq(genre.id, genreId),
    });

    if (!existingGenre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Validate the update data
    const requestData = await request.json();
    const validation = validate(updateGenreSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };

    // Build the genre updates
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;

    // Update the genre
    await db.update(genre).set(updates).where(eq(genre.id, genreId));

    // Fetch the updated genre to return
    const updatedGenre = await db.query.genre.findFirst({
      where: eq(genre.id, genreId),
    });

    return NextResponse.json({
      message: "Genre updated successfully",
      genre: updatedGenre,
    });
  } catch (error) {
    console.error("Error updating genre:", error);
    return NextResponse.json(
      { error: "Failed to update genre" },
      { status: 500 },
    );
  }
}

async function DELETE(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const genreId = searchParams.get("genreId");

  if (!genreId) {
    return NextResponse.json(
      { error: "Genre ID is required" },
      { status: 400 },
    );
  }

  // Validate genre ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(genreId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid genre ID format" },
      { status: 400 },
    );
  }

  try {
    // Check if the genre exists
    const existingGenre = await db.query.genre.findFirst({
      where: eq(genre.id, genreId),
    });

    if (!existingGenre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Check if any titles use this genre
    const genreUsage = await db
      .select({ titleId: titleToGenre.titleId })
      .from(titleToGenre)
      .where(eq(titleToGenre.genreId, genreId))
      .limit(1);

    if (genreUsage.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete genre that is in use by titles. Remove all title associations first." 
        }, 
        { status: 400 }
      );
    }

    // Delete the genre
    await db.delete(genre).where(eq(genre.id, genreId));

    return NextResponse.json(
      {
        message: "Genre deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting genre:", error);
    return NextResponse.json(
      { error: "Failed to delete genre" },
      { status: 500 },
    );
  }
}

export { GET, POST, PATCH, DELETE };
