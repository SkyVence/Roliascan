import { setupFastify, setupFastifyRoutes, startFastify } from "@/modules/fastify";
export async function bootstrap(): Promise<void> {
    console.log(`Backend Booting up...`);

    const app = await setupFastify();
    await setupFastifyRoutes(app);
    await startFastify(app);

    console.log(`App setup, ready to handle requests`);
    console.log(`-----------------------------------`);
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});