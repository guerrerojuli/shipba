"use server";
import { createDocument as createDocumentDatabase, getDocumentCached, getUserDocumentsListCached } from "@/lib/db/queries";
import { DocumentInfo, DocumentInsert } from "@/lib/db/types";
import { auth } from "@clerk/nextjs";

export async function getDocumentList() {
    const {userId} = auth();
    if (!userId) throw new Error("Unauthorized");
    return await getUserDocumentsListCached(userId);
}

export async function getDocument(documentId: string) {
    return await getDocumentCached(documentId);
}

export async function createDocument(document: DocumentInsert) {
    await createDocumentDatabase(document);
    const {userId, content, ...documentData} = document;
    return documentData as DocumentInfo;
}

