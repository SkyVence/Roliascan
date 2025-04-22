import fastify, { FastifyInstance } from "fastify";
import { setupRoutes } from "./route";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import cors from '@fastify/cors';
import { ZodError } from "zod";

export async function setupFastify(): Promise<FastifyInstance> {
    console.log(`Setting up Fastify...`);
    const app = fastify()

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    
    app.setErrorHandler((err, req, reply) => {
        if (err instanceof ZodError) {
            reply.status(400).send({
                errorType: 'validation',
                errors: err.message,
            });
            return;
        }
        
        // TODO: Add more error handlers

        console.error(`unhandled exception on server`, err);
        console.error(err.stack);
        reply.status(500).send({
            errorType: 'message',
            message: 'Internal Server Error',
        });
    });

    await app.register(cors, {
        origin: 'localhost:3000',
        credentials: true,
    });

    return app;
}


export async function startFastify(app: FastifyInstance) {
    // Add file logging for future debugging

    return new Promise<void>((resolve) => {
        app.listen({
            port: 3001,
            host: '0.0.0.0',
        },
        function (err) {
            if (err) {
                app.log.error(err);
                process.exit(1);
            }
            resolve();
        }
    )
    })
}

export async function setupFastifyRoutes(app: FastifyInstance) {
    await app.register(
        (api, opts, done) => {
            setupRoutes(api);
            done();
        },
        {
            prefix: '/api',
        }
    )
}
