import "server-only";

import { unstable_cache as nextCache, revalidateTag } from 'next/cache';
import { documents } from "./schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { DocumentInsert } from "./types";

const CACHE_TAGS = {
    file: (fileId: string) => `file-${fileId}` as const,
    userFiles: (userId: string) => `user-${userId}-files` as const,
} as const

function invalidateTags(tags: (string | undefined)[]) {
    tags.forEach(tag => tag && revalidateTag(tag))
}

export function getUserDocumentsListCached(userId: string) {
    return nextCache(
        getUserDocumentsList,
        [CACHE_TAGS.userFiles(userId)],
        {
            revalidate: 60,
            tags: [CACHE_TAGS.userFiles(userId)],
        }
    )(userId);
}

async function getUserDocumentsList(userId: string) {
    return db.select({
        id: documents.id,
        name: documents.name,
        createdAt: documents.createdAt,
        createdBy: documents.createdBy,
    }).from(documents).where(eq(documents.userId, userId));
}

export function getDocumentCached(documentId: string) {
    return nextCache(
      getDocument,
      [CACHE_TAGS.file(documentId)],
      {
        revalidate: 60,
        tags: [CACHE_TAGS.file(documentId)],
      }
    )(documentId);
  }
  
async function getDocument(documentId: string) {
    return db.select().from(documents).where(eq(documents.id, documentId));
}

export async function createDocument(document: DocumentInsert) {
    return db.insert(documents).values(document);
}

export async function updateDocument(documentId: string, document: DocumentInsert) {
    return db.update(documents).set(document).where(eq(documents.id, documentId));
}

export async function deleteDocument(documentId: string) {
    return db.delete(documents).where(eq(documents.id, documentId));
}
