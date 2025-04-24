import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    let isLoggedIn = false;
    if (token) {
        try {
            // Attempt to verify the token by calling the backend /auth/me endpoint
            const response = await axios.get(`${backendUrl}/auth/me`, { // Ensure URL path is correct
                headers: {
                    Authorization: `Bearer ${token}`
                },
                // Optional: Set a timeout to prevent the request from hanging indefinitely
                timeout: 5000 // 5 seconds timeout
            });

            // If the backend confirms the token is valid (status 200), set isLoggedIn to true
            if (response.status === 200) {
                isLoggedIn = true;
            }
            // If the status is not 200, isLoggedIn remains false (its initial value)
        } catch (error) {
            // If any error occurs (network error, timeout, non-2xx status like 401, 403, 500),
            // the token is considered invalid or validation failed.
            isLoggedIn = false; // Ensure isLoggedIn is false on any error
            console.error('Middleware auth check failed:', error instanceof axios.AxiosError ? error.message : error);
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


