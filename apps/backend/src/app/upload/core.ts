// src/app/upload/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

// Proper authentication using the better-auth library
const getUser = async (req: Request) => {
  // Use the auth API to get the current user session
  try {
    const authRequest = new Request(new URL("/auth/session", req.url), {
      headers: req.headers,
    });
    const response = await auth.handler(authRequest);

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
};

// FileRouter defines your upload endpoints
export const ourFileRouter = {
  // Image uploader route
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Authenticate the user
      const user = await getUser(req);
      if (!user) throw new UploadThingError("Unauthorized");

      // Return user metadata for use in onUploadComplete
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("Image file url:", file.ufsUrl);
      // Store file.url in your database as needed
    }),

  // Chapter content uploader for manga/comic pages
  chapterContentUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 50 },
  })
    .middleware(async ({ req }) => {
      // Authenticate the user
      const user = await getUser(req);
      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Chapter content upload complete for userId:",
        metadata.userId,
      );
      console.log("Chapter content file url:", file.ufsUrl);
      console.log("Chapter content file key:", file.key);
      // The URL and key should be used when creating or updating chapter content
      // via the chapter API endpoints
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
