import { FastifyInstance } from "fastify";
import { config } from "./config/index";
import { fastifyCookie } from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import { AuthMiddleware, PermissionMiddleware } from "./middleware";
import { AuthController } from "./controllers/auth.controllers";
import fastifyFormbody from "@fastify/formbody";
import { TitlesController } from "./controllers/titles.controllers";
import { AuthorsController } from "./controllers/authors.controllers";
import { ChaptersController } from "./controllers/chapters.controllers";
import cors from "@fastify/cors";
/**
 * Setup Fastify
 * @param fastify - Fastify instance
 * @returns Fastify instance
 */
export async function setupFastify(fastify: FastifyInstance) {
    // Register Plugins HERE 
    await fastify.register(cors, {
        origin: config.cors.origin,
        credentials: true,
    })
    await fastify.register(fastifyFormbody)
    await fastify.register(fastifyCookie, {
        hook: "onRequest",
        secret: config.jwt.secret,
    });
    await fastify.register(fastifyJwt, {
        secret: config.jwt.secret,
    });
    AuthMiddleware(fastify);
    PermissionMiddleware(fastify);
}

/**
 * Setup Fastify Routes
 * @param fastify - Fastify instance
 * @returns Fastify instance
 */
export async function setupFastifyRoutes(fastify: FastifyInstance) {
    await fastify.register(AuthController, {
        prefix: "/auth",
    });
    await fastify.register(TitlesController)
    await fastify.register(AuthorsController)
    await fastify.register(ChaptersController)
}

/**
 * Start Fastify
 * @param fastify - Fastify instance
 * @returns Fastify instance
 */
export async function startFastify(fastify: FastifyInstance) {
    try {
        await fastify.listen({
            host: config.server.host,
            port: config.server.port,
        });
        // Log the address the server is listening on
        fastify.log.info(`Server listening at http://${config.server.host}:${config.server.port}`);
        
    } catch (error) {
        // Log the error using fastify's logger and re-throw
        fastify.log.error("Failed to start server:", error);
        // Re-throw the error to be caught by the caller (initializeApp)
        throw error;
    }
}
