import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull(),
    email: text("email").notNull().unique(),
    name: text("name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable('documents', {
    id: uuid('id').primaryKey().notNull(),
    name: text('name').notNull(),
    content: jsonb('content').$type<Array<{ index: number; line: string }>>(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }), // Clave foránea a users(id)
    createdBy: text('created_by').notNull(),  // Email address
    createdAt: timestamp('created_at').notNull().defaultNow(),
});