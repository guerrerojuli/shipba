import { documents } from './schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type DocumentInsert = InferInsertModel<typeof documents>;
export type DocumentSelect = InferSelectModel<typeof documents>;
