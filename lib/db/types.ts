import { documents } from './schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type DocumentInsert = InferInsertModel<typeof documents>;
export type DocumentSelect = InferSelectModel<typeof documents>;
export type DocumentInfo = Omit<DocumentSelect, 'content'|'userId'>;

export type DocumentContent = {
    index: number;
    line: string;
}


