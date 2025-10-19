import { Pool } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./env";

export const pool=new Pool(
    {
        connectionString:getDatabaseUrl()
    }
);

