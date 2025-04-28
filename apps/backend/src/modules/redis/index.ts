import { config } from "@/config";
import { FastifyInstance } from "fastify";
import Redis from "ioredis";

export function initRedisInstance(fastify: FastifyInstance) {
    const redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    })
    redis.on('error', (err) => {
        fastify.log.error('Redis connection error:', err);
    });

    return redis;
}

