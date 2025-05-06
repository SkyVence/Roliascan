import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Matching all API routes
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001", // Replace with your frontend domain
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, uploadthing-hook, x-uploadthing-signature, x-uploadthing-filename, x-uploadthing-file-type", // Include UploadThing specific headers
          },
        ],
      },
    ];
  },
};

export default nextConfig;
