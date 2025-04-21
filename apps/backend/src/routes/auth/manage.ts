import { z } from "zod";
import { makeRouter } from "@/services/router";

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const manageAuthRoutes = makeRouter((app) => {

})