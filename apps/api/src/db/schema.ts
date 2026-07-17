import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  fontAKey: text("font_a_key").notNull(),
  fontBKey: text("font_b_key").notNull(),
  fontSize: integer("font_size").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
