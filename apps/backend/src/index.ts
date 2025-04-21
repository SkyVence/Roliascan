import Fastify from "fastify"
import { config } from "./config"
import { setupFastify, setupFastifyRoutes, startFastify } from "./server"
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.env.NODE_ENV === "development" ? "debug" : "info",
  },
}).withTypeProvider<ZodTypeProvider>()

// Set Zod as the schema validator and serializer
fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

// Setup Fastify
setupFastify(fastify)

// Setup routes
setupFastifyRoutes(fastify)

// Start server
startFastify(fastify)
