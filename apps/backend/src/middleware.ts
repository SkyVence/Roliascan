import { NextRequest, NextResponse } from "next/server";


const allowedOrigins = ["http://localhost:3001"]

export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    const origin = requestHeaders.get('origin')
  
    // Create a base response object.
    // For OPTIONS preflight requests, we want to return a 204 No Content.
    // For other requests, we'll let them pass through to the route handler.
    const response =
      request.method === 'OPTIONS'
        ? new NextResponse(null, { status: 204 })
        : NextResponse.next()
  
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (!origin && process.env.NODE_ENV !== 'production') {
      // Allow requests with no origin (e.g., Postman, curl) in development
      response.headers.set('Access-Control-Allow-Origin', '*')
    } else if (origin && !allowedOrigins.includes(origin)) {
      // If origin is present but not allowed, we might want to return an error
      // or simply not set the ACAO header, letting the browser block it.
      // For simplicity here, we'll just not set it if not allowed.
      // You could return a 403 Forbidden response here if desired.
      console.warn(`Origin ${origin} not allowed.`)
    }
  
  
    // Set other standard CORS headers
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
    )
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  
    // If it's an OPTIONS request, we've already built the response with headers.
    if (request.method === 'OPTIONS') {
      return response
    }
  
    // For other requests, let Next.js handle them after adding headers.
    return response
  }
  
  export const config = {
    matcher: '/:path*', // Apply middleware only to API routes
  }