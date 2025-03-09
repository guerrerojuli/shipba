"use server";
import { createDocument as createDocumentDatabase, getDocumentCached, getUserDocumentsListCached, deleteDocument as deleteDocumentDatabase, updateDocument } from "@/lib/db/queries";
import { DocumentContent, DocumentInfo, DocumentInsert } from "@/lib/db/types";
import { auth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fileToMarkdown } from "./ai";

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

export async function uploadDocument(form: FormData) {
    const user = await currentUser();
    if (!user || !user.id) throw new Error("Unauthorized");
    const file = form.get("file") as File;
    if (!file) throw new Error("No file uploaded");
    if (file.type !== "application/pdf") throw new Error("File must be a PDF");

    const markdown = await fileToMarkdown(file);

    const document: DocumentInsert = {
        id: crypto.randomUUID(),
        name: file.name,
        createdBy: user.emailAddresses[0].emailAddress,
        userId: user.id,
        content: markdown.split("\n").map((line, index) => ({
            index,
            line
        })),
    }
    return await createDocument(document);
}

export async function createDocument(document: DocumentInsert) {
    await createDocumentDatabase(document);
    const {userId, content, ...documentData} = document;
    revalidatePath("/");
    return documentData as DocumentInfo;
}

export async function saveDocument(documentId: string, content: DocumentContent[]) {
    await updateDocument(documentId, { content });
    revalidatePath("/");
}

export async function deleteDocument(documentId: string) {
    await deleteDocumentDatabase(documentId);
    revalidatePath("/");
}

