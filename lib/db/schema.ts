import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { DocumentContent } from "./types";

export const users = pgTable("users", {
    id: text("id").primaryKey().notNull(),
    email: text("email").notNull().unique(),
    name: text("name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    stripeCustomerId: text("stripe_customer_id"),
});

export const documents = pgTable('documents', {
    id: uuid('id').primaryKey().notNull(),
    name: text('name').notNull(),
    content: jsonb('content').$type<DocumentContent[]>().default([]).notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }), // Clave foránea a users(id)
    createdBy: text('created_by').notNull(),  // Email address
    createdAt: timestamp('created_at').notNull().defaultNow(),
});