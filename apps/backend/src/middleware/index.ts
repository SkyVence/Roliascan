import { verifySessionToken, UserPayload } from "@/utils/cookie";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";


declare module 'fastify' {
    interface FastifyRequest {
      CurrentUser: UserPayload;
    }
  }

export function AuthMiddleware(fastify: FastifyInstance) {
    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const sessionToken = request.cookies.session;
            if (!sessionToken) {
                return reply.status(401).send({ message: "Unauthorized" });
            }
            const session = await verifySessionToken(sessionToken);

            if (!session) {
                return reply.status(401).send({ message: "Invalid session token" });
            }

            request.CurrentUser = session;
        } catch (error) {
            reply.clearCookie("session");
            return reply.status(401).send({ message: "Unauthorized" });
        }
    })
}


// Need to be used after the authenticate middleware, also need rework so the higher roles can access the lower ones
export function PermissionMiddleware(fastify: FastifyInstance) {
    fastify.decorate("hasPermission", (...roles: string[]) => {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.CurrentUser;
            if (!roles.includes(user.role)) {
                return reply.status(403).send({ message: "Forbidden" });
            }
        }
    })
}
