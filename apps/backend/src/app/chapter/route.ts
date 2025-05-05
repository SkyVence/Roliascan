import db from "@/lib/db";
import { z } from "zod";
import { chapter, chapterContent } from "@/lib/db/schema/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  createChapterRequestSchema,
  updateChapterRequestSchema,
  validate,
} from "@/lib/validation";

async function GET(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const chapterId = searchParams.get("chapterId");
  const titleId = searchParams.get("titleId");

  try {
    if (chapterId) {
      // Fetch a specific chapter by ID
      const uuidSchema = z.string().uuid();
      const result = uuidSchema.safeParse(chapterId);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid chapter ID format" },
          { status: 400 },
        );
      }

      const chapterData = await db.query.chapter.findFirst({
        where: eq(chapter.id, chapterId),
        with: {
          title: true,
          content: {
            orderBy: (content) => content.displayOrder,
          },
          uploadedBy: true,
        },
      });

      if (!chapterData) {
        return NextResponse.json(
          { error: "Chapter not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ chapter: chapterData });
    } else if (titleId) {
      // Fetch all chapters for a title
      const uuidSchema = z.string().uuid();
      const result = uuidSchema.safeParse(titleId);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid title ID format" },
          { status: 400 },
        );
      }

      const chapters = await db.query.chapter.findMany({
        where: eq(chapter.titleId, titleId),
        orderBy: (chapter) => chapter.chapterNumber,
        with: {
          content: true,
        },
      });

      return NextResponse.json({ chapters });
    } else {
      // Fetch all chapters (paginated)
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

        // First attempt to get chapters with proper pagination
        console.log("Fetching chapters...");
        let chapters: any[] = [];
        try {
          chapters = await db.query.chapter.findMany({
            limit,
            offset,
            with: {
              title: true,
            },
            orderBy: (chapter) => [chapter.updatedAt, { direction: "desc" }],
          });
          console.log(
            "Chapters query succeeded, got",
            chapters.length,
            "results",
          );
        } catch (chaptersError) {
          console.error("Error fetching chapters:", chaptersError);
          // Fallback to a simpler query without relations if the main query fails
          try {
            const simpleResults = await db
              .select()
              .from(chapter)
              .limit(limit)
              .offset(offset);
            chapters = simpleResults || [];
            console.log(
              "Simple fallback query succeeded, got",
              chapters.length,
              "results",
            );
          } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
            // Continue with empty chapters if both queries fail
          }
        }

        // Get count of total items for pagination
        let count = 0;
        try {
          const allChapters = await db.select({ id: chapter.id }).from(chapter);
          count = allChapters?.length || 0;
          console.log("Count query succeeded, count =", count);
        } catch (countError) {
          console.error("Error getting count:", countError);
          // Continue with count = 0 if query fails
        }

        // Return results with pagination
        return NextResponse.json({
          chapters,
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
    console.error("Error fetching chapter(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter data" },
      { status: 500 },
    );
  }
}

async function POST(request: NextRequest, response: NextResponse) {
  try {
    const requestData = await request.json();

    // Validate request data
    const validation = validate(createChapterRequestSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Create the chapter
    const now = new Date();
    const chapterData = {
      name: data.name,
      chapterNumber: data.chapterNumber,
      titleId: data.titleId,
      uploadedBy: data.uploadedBy,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const createdChapters = await db
      .insert(chapter)
      .values(chapterData)
      .returning();

    if (
      !createdChapters ||
      !Array.isArray(createdChapters) ||
      createdChapters.length === 0
    ) {
      throw new Error("Failed to create chapter");
    }

    const createdChapter = createdChapters[0];

    // Create chapter content
    if (data.content && data.content.length > 0) {
      await db.insert(chapterContent).values(
        data.content.map((content) => ({
          chapterId: createdChapter.id,
          displayOrder: content.displayOrder,
          url: content.url,
          key: content.key,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    // Fetch the created chapter with its content
    const fullChapter = await db.query.chapter.findFirst({
      where: eq(chapter.id, createdChapter.id),
      with: {
        content: {
          orderBy: (content) => content.displayOrder,
        },
        title: true,
      },
    });

    return NextResponse.json(
      {
        message: "Chapter created successfully",
        chapter: fullChapter,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 },
    );
  }
}

async function PATCH(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const chapterId = searchParams.get("chapterId");

  if (!chapterId) {
    return NextResponse.json(
      { error: "Chapter ID is required" },
      { status: 400 },
    );
  }

  // Validate chapter ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(chapterId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid chapter ID format" },
      { status: 400 },
    );
  }

  try {
    // First check if the chapter exists
    const existingChapter = await db.query.chapter.findFirst({
      where: eq(chapter.id, chapterId),
      with: {
        content: true,
      },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Validate the update data
    const requestData = await request.json();
    const validation = validate(updateChapterRequestSchema, requestData);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const now = new Date();
    const updates: Record<string, any> = { updatedAt: now };

    // Build the chapter updates
    if (data.name !== undefined) updates.name = data.name;
    if (data.chapterNumber !== undefined)
      updates.chapterNumber = data.chapterNumber;

    // Update the chapter if there are any fields to update
    if (Object.keys(updates).length > 1) {
      // > 1 because updatedAt is always included
      await db.update(chapter).set(updates).where(eq(chapter.id, chapterId));
    }

    // Handle content updates if provided
    if (data.content && data.content.length > 0) {
      // Get existing content IDs to compare
      const existingContentIds = existingChapter.content.map(
        (content) => content.id,
      );

      for (const content of data.content) {
        if (content.id) {
          // Update existing content
          if (existingContentIds.includes(content.id)) {
            await db
              .update(chapterContent)
              .set({
                displayOrder: content.displayOrder,
                url: content.url,
                key: content.key,
                updatedAt: now,
              })
              .where(eq(chapterContent.id, content.id));
          }
        }
      }
    }

    // Handle content additions
    if (data.addContent && data.addContent.length > 0) {
      await db.insert(chapterContent).values(
        data.addContent.map((content) => ({
          chapterId: chapterId,
          displayOrder: content.displayOrder,
          url: content.url,
          key: content.key,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    // Handle content removals
    if (data.removeContent && data.removeContent.length > 0) {
      await db
        .delete(chapterContent)
        .where(
          and(
            eq(chapterContent.chapterId, chapterId),
            inArray(chapterContent.id, data.removeContent),
          ),
        );
    }

    // Fetch the updated chapter to return
    const updatedChapter = await db.query.chapter.findFirst({
      where: eq(chapter.id, chapterId),
      with: {
        content: {
          orderBy: (content) => content.displayOrder,
        },
        title: true,
      },
    });

    return NextResponse.json({
      message: "Chapter updated successfully",
      chapter: updatedChapter,
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Failed to update chapter" },
      { status: 500 },
    );
  }
}

async function DELETE(request: NextRequest, response: NextResponse) {
  const searchParams = request.nextUrl.searchParams;
  const chapterId = searchParams.get("chapterId");

  if (!chapterId) {
    return NextResponse.json(
      { error: "Chapter ID is required" },
      { status: 400 },
    );
  }

  // Validate chapter ID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(chapterId);
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Invalid chapter ID format" },
      { status: 400 },
    );
  }

  try {
    // Check if the chapter exists
    const existingChapter = await db.query.chapter.findFirst({
      where: eq(chapter.id, chapterId),
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Delete the chapter - related content will be deleted via cascade
    await db.delete(chapter).where(eq(chapter.id, chapterId));

    return NextResponse.json(
      {
        message: "Chapter deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 },
    );
  }
}

export { GET, POST, PATCH, DELETE };
