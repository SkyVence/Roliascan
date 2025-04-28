import { fastify } from "fastify";
import { startFastify, setupFastify, setupFastifyRoutes } from "./server";
import { envToLogger } from "./modules/logger/envToLogger";
import { config } from "./config/index";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import { initRedisInstance } from "./modules/redis";
import { UserPayload } from "./utils/cookie";


declare module 'fastify' {
    interface FastifyInstance {
      authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
      hasPermission: (...roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
    interface FastifyRequest {
        CurrentUser: UserPayload;
    }
}
  
const app = fastify({
    logger: envToLogger[config.env.NODE_ENV] ?? true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Declare redisClient variable, initialize later
export let redisClient: ReturnType<typeof initRedisInstance>;

// Wrap setup and start in an async function to use await
const initializeApp = async () => {
    try {
        app.log.info("[1/5] Initializing server...");

        app.log.info("[2/5] Initializing Redis...");
        redisClient = initRedisInstance(app); // Initialize Redis here
        app.log.info("Redis dez nut")
        app.log.info("[2/5] Redis initialized.");

        app.log.info("[3/5] Setting up Fastify plugins/middleware...");
        await setupFastify(app);
        app.log.info("[3/5] Fastify plugins/middleware setup complete.");

        app.log.info("[4/5] Setting up Fastify routes...");
        await setupFastifyRoutes(app);
        app.log.info("[4/5] Fastify routes setup complete.");

        app.log.info("[5/5] Starting Fastify server...");
        await startFastify(app); // startFastify now logs success or throws
        // Success log is now inside startFastify

    } catch (err) {
        // Log the raw error object
        app.log.error({ msg: "ERROR during server initialization", errorCaught: err });
        // Attempt to log more details
        if (err instanceof Error) {
            app.log.error("Error stack trace:", err);
        }
        process.exit(1);
    }
};

initializeApp();

