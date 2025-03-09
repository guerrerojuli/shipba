"use server";
import { createDocument as createDocumentDatabase, getDocumentCached, getUserDocumentsListCached, deleteDocument as deleteDocumentDatabase, updateDocument } from "@/lib/db/queries";
import { DocumentContent, DocumentInfo, DocumentInsert } from "@/lib/db/types";
import { auth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import pdf from "pdf-parse";

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

    const content = await pdf(Buffer.from(await file.arrayBuffer()));

    const document: DocumentInsert = {
        id: crypto.randomUUID(),
        name: file.name,
        createdBy: user.emailAddresses[0].emailAddress,
        userId: user.id,
        content: content.text.split("\n").map((line, index) => ({
            index,
            line
        })),
    }
    return await createDocument(document);
}

export async function createDocument(document: DocumentInsert) {
    const documentData = await createDocumentDatabase(document);
    revalidatePath("/");
    return documentData;
}

export async function saveDocument(documentId: string, content: DocumentContent[]) {
    const updatedDocument = await updateDocument(documentId, { content });
    revalidatePath("/");
    return updatedDocument;
}

export async function renameDocument(documentId: string, name: string) {
    await updateDocument(documentId, { name });
    revalidatePath("/");
}

export async function deleteDocument(documentId: string) {
    await deleteDocumentDatabase(documentId);
    revalidatePath("/");
}
