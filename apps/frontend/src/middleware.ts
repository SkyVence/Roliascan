import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import axiosInstance from './lib/axios';

export default async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    let isLoggedIn = false;
    if (token) {
        try {
            const response = await axiosInstance.get("/auth/me", {
                headers: {
                    Cookie: `token=${token}`,
                },
            });
            if (response.status === 200) {
                isLoggedIn = true;
            }
        } catch (error) {
            isLoggedIn = false;
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


