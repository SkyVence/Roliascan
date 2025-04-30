import { verifySessionToken, UserPayload } from "@/utils/cookie";
import { FastifyInstance, FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";


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
            fastify.log.info(`Session token: ${sessionToken}`);
            if (!sessionToken) {
                fastify.log.info("No session token found");
                return reply.status(401).send({ message: "Unauthorized - Testing authors route" });
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


// Define role hierarchy (higher index = higher permissions)
const ROLES = ["user", "moderator", "admin", "owner"];

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
            if (!hasMinimumRole(currentUser.role, minRole)) {``
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
        // Keep the request type generic here
        return async (request: FastifyRequest, reply: FastifyReply) => {
            const currentUser = request.CurrentUser;

            if (!currentUser) {
                return reply.status(401).send({ message: "Unauthorized" });
            }

            // Cast params and body to the expected types inside the function
            const params = request.params as TeamRequestParams;
            const body = request.body as TeamRequestBody;
            const teamId = params?.teamId || body?.teamId;

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
