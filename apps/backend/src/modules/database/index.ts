import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "@/config";
import * as schema from "./schema";

const db = drizzle(config.db.url, { schema: { ...schema } });

export default db
