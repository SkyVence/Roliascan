import { NextRequest, NextResponse } from 'next/server';


export default async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    
}
