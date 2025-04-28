import { config } from "@/config";
import { redisClient } from "@/index";

export type UserPayload = {
    userId: string;
    email: string;
    username: string;
    role: string;
}

export async function generateSessionToken(userPayload: UserPayload, sessionId: string) {
    
    try {
        const storeSession = await redisClient.setex(`session:${sessionId}`, config.jwt.expiresIn, JSON.stringify(userPayload));
        return true;
    } catch (error) {
        console.error("Error generating session token:", error);
        return false;
    }
}

export async function verifySessionToken(sessionId: string): Promise<UserPayload | null> {
    const session = await redisClient.get(`session:${sessionId}`);
    return session ? JSON.parse(session) as UserPayload : null;
}

export async function deleteSessionToken(sessionId: string) {
    await redisClient.del(`session:${sessionId}`);
}