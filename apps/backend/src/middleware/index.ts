import { verifySessionToken, UserPayload } from "@/utils/cookie";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";


declare module 'fastify' {
    interface FastifyRequest {
      CurrentUser: UserPayload;
    }
  }

// Define interfaces for request params and body that include teamId
interface TeamRequestParams {
    teamId?: string;
}

interface TeamRequestBody {
    teamId?: string;
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

// DEPRECATED
/*
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
*/


// Define role hierarchy (higher index = higher permissions)
const ROLES = ["user", "Moderator", "Admin", "Owner"];

// Helper function to check if a role meets the minimum required level
function hasMinimumRole(userRole: string, minRequiredRole: string): boolean {
  const userRoleIndex = ROLES.indexOf(userRole);
  const requiredRoleIndex = ROLES.indexOf(minRequiredRole);
  
  // Return false if role not found or insufficient
  if (userRoleIndex === -1) return false;
  if (requiredRoleIndex === -1) return false;
  
  return userRoleIndex >= requiredRoleIndex;
}


export function UserRoleMiddleware(fastify: FastifyInstance) {
    fastify.decorate("hasRole", (minRole: string) => {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            const currentUser = request.CurrentUser;
    
            // Check if user is authenticated
            if (!currentUser) {
              return reply.code(401).send({ 
                error: "Unauthorized - Authentication required" 
              });
            }
            
            // Check if user has sufficient site-wide role
            if (!hasMinimumRole(currentUser.role, minRole)) {
              return reply.code(403).send({ 
                error: "Forbidden - Insufficient permissions",
                required: minRole,
                current: currentUser.role
              });
            }
        }
    })
}

export function TeamRoleMiddleware(fastify: FastifyInstance) {
    fastify.decorate("hasTeamRole", (minRole: string) => {
        return async (request: FastifyRequest<{
            Params: TeamRequestParams,
            Body: TeamRequestBody
        }>, reply: FastifyReply) => {
            const currentUser = request.CurrentUser;

            if (!currentUser) {
                return reply.status(401).send({ message: "Unauthorized" });
            }

            const teamId = request.params?.teamId || request.body?.teamId;
            if (!teamId) {
                return reply.status(400).send({ message: "Team ID is required" });
            }

            const teamRole = currentUser.teamRole[teamId];
            
            if (!teamRole) {
                return reply.status(403).send({ message: "Forbidden - User is not a member of this team" });
            }

            if (!hasMinimumRole(teamRole, minRole)) {
                return reply.status(403).send({ message: "Forbidden - Insufficient permissions", requiredRole: minRole, userRole: teamRole });
            }
        }
    })
}