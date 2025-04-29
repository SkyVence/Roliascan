import { config } from "@/config";
import { redisClient } from "@/index";

export type UserPayload = {
    userId: string;
    email: string;
    username: string;
    role: string;
    teamRole: {
        [teamId: string]: string;
    }
}

export async function saveSessionData(userPayload: UserPayload, sessionId: string) {
    
    try {
        const storeSession = await redisClient.setex(`session:${sessionId}`, config.jwt.expiresIn, JSON.stringify(userPayload));
        return true;
    } catch (error) {
        console.error("Error generating session token:", error);
        return false;
    }
}

// New function (uses SET, keeps existing timer)
export async function updateSessionDataOnly(userPayload: UserPayload, sessionId: string) {
    try {
        // Check if the key exists first to avoid creating a non-expiring session if it somehow disappeared
        const exists = await redisClient.exists(`session:${sessionId}`);
        if (!exists) {
            console.warn(`Attempted to update non-existent session: ${sessionId}`);
            // Optionally, call generateSessionToken here to recreate it, or just return false
            return false;
        }
        // Use SET to only update the value, not the expiry
        await redisClient.set(`session:${sessionId}`, JSON.stringify(userPayload));
        return true;
    } catch (error) {
        console.error("Error updating session data:", error);
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