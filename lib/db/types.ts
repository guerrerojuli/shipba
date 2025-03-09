import { documents } from './schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type DocumentInsert = InferInsertModel<typeof documents>;
export type DocumentSelect = InferSelectModel<typeof documents>;
export type DocumentUpdate = Partial<DocumentInsert>;
export type DocumentInfo = Omit<DocumentSelect, 'content'|'userId'>;
