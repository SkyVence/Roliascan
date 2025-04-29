import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const allowedRoles = ["owner","admin", "moderator"];

export default async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    let isLoggedIn = false;
    if (session) {
        try {
            const response = await axios.get("/auth/me", {
                headers: {
                    Cookie: `session=${session}`,
                },
            })
            if (response.status === 200) {
                isLoggedIn = true;
            }
        } catch (error) {
            isLoggedIn = false;
            console.error('Middleware auth check failed:', error instanceof axios.AxiosError ? error.response?.data : error);
        }
    }

    if (request.url.includes('/auth/')) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }
    return NextResponse.next();
}