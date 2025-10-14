import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true
// to chache the connections that has been set

if (!process.env.DATABASE_URL) {
    throw new Error('database url not found')
}

const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql, { schema });

