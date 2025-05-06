import { betterFetch } from "@better-fetch/fetch";
import type { authClient } from "@/lib/auth-client";
import { NextRequest, NextResponse } from "next/server";

type Session = typeof authClient.$Infer.Session;

export async function middleware(req: NextRequest) {
    const { data: session } = await betterFetch<Session>("/auth/get-session", {
        baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
        headers: {
            cookie: req.headers.get("cookie") ?? "",
        }
    });

    const { pathname } = req.nextUrl;

    // If trying to access user routes and not logged in, redirect to sign-in
    if (pathname.startsWith("/user/") && !session) {
        const signInUrl = new URL("/auth/sign-in", req.url);
        signInUrl.searchParams.set("callbackUrl", req.url); // Optional: add callback URL
        return NextResponse.redirect(signInUrl);
    }

    // If logged in and trying to access sign-in or sign-up, redirect to a user page (e.g., profile)
    if (session && (pathname === "/auth/sign-in" || pathname === "/auth/sign-up")) {
        return NextResponse.redirect(new URL("/user/profile", req.url)); // Adjust the redirect URL as needed
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/user/:path*", "/auth/sign-in", "/auth/sign-up"],
}; 