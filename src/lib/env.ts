import { error } from "console";

export const env={
    databaseUrl:process.env.DATABASE_URL!,
}

export function getDatabaseUrl():string{
    const url=env.databaseUrl;
    if(!url){
        throw error;
    }
    return url;
}