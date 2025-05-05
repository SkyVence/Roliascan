// src/app/upload/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // Add basic configuration if needed
  config: {
    // Optional: Override the default callback URL if needed
    callbackUrl: "/upload/callback",
  },
});
