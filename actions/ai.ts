"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import parsePdf from "pdf-parse";
export async function fileToMarkdown(file: Blob) {
    const content = await parsePdf(Buffer.from(await file.arrayBuffer()));
    const result = await generateText({
        model: google("gemini-2.0-flash"),
        system: "Convert the whole document to raw HTML. DONT wrap in code block. Use <h1>, <h2>, <h3>, <p>, <ul>, <li>, <a>, <img>, <table>, <tr>, <td>, <th>, <tbody>, <thead>, <tfoot> tags. Dont make innecesary line jumps.",
        messages: [
            {
                role: "user",
                content: content.text,
            },
        ],

    })
    return result.text;
}
