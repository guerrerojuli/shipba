"use server";
import { createDocument as createDocumentDatabase, getDocumentCached, getUserDocumentsListCached, deleteDocument as deleteDocumentDatabase } from "@/lib/db/queries";
import { DocumentInfo, DocumentInsert } from "@/lib/db/types";
import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";

export async function getDocumentList() {
    const {userId} = auth();
    if (!userId) throw new Error("Unauthorized");
    return await getUserDocumentsListCached(userId);
}

export async function getDocument(documentId: string) {
    const documents = await getDocumentCached(documentId);
    if (documents.length === 0) throw new Error("Document not found");
    return documents[0];
}

export async function createDocument(document: DocumentInsert) {
    await createDocumentDatabase(document);
    const {userId, content, ...documentData} = document;
    revalidatePath("/");
    return documentData as DocumentInfo;
}

export async function deleteDocument(documentId: string) {
    await deleteDocumentDatabase(documentId);
    revalidatePath("/");
}

