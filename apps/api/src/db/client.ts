import { drizzle } from "drizzle-orm/d1";
import { sessions } from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema: { sessions } });
}
