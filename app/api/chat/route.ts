import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { z } from "zod"
import type { Message } from "ai"
import type { DocumentSelect } from "@/lib/db/types"


const suggestEdit = tool({
  description: "Suggest an edit to the document",
  parameters: z.object({
    newDocument: z.string().describe("The new document content"),
  }),
  execute: async ({ newDocument }) => {
    console.log("Tool executed with newDocument:", newDocument)
    return { success: true, newDocument: newDocument }
  }
})

// Create a client
const genAI = google("gemini-1.5-pro-latest")


interface RequestBody {
  messages: Message[]
  selectedText: string
  documentContext: DocumentSelect[]
  activeDocument: Document
}

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, selectedText, documentContext, activeDocument }: RequestBody = await req.json()

  // Create context from documents
  let context = ""
  if (documentContext) {
    context += "Context documents:\n"
    context += JSON.stringify(documentContext)
  }

  if (activeDocument) {
    context += "Current document:\n"
    context += JSON.stringify(activeDocument)
  }

  if (selectedText) {
    context += "Selected text:\n"
    context += selectedText
  }

  console.log("Context:", context)

  // Add system message with context
  const systemMessage = `
You are an AI assistant specialized in document editing, writing, translation, and analysis. You have access to a suggestEdit tool that allows you to suggest edits to the entire document content.

FORMAT:
- ALWAYS format your responses using markdown syntax
- Use proper headings (# ## ###), lists (- or 1.), code blocks (\`\`\`), and other markdown elements
- For inline code, use single backticks \`code\`
- For math expressions, use \$...\$ for inline and \$\$...\$\$ for block math

When suggesting edits:
1. Use the suggestEdit tool to provide a complete new version of the document content.
2. The new document content should be provided as a single string with line breaks preserved.
3. Provide a brief explanation of your changes after executing suggestEdit. Explanations must be concise.

GUIDELINES:
- You can translate text as part of editing tasks when explicitly requested by the user.
- Prioritize edits that improve clarity, readability, style, and correctness.
- Preserve the original meaning, intention, style, and tone of the document unless explicitly asked otherwise.
- Provide specific, actionable suggestions with brief justifications, no more that 2 sentences and 15 words.

${context ? `CONTEXT:\n${context}` : ""}

ALWAYS USE suggestEdit FOR TEXT CHANGES.`;
  


  // Generate a response
  const response = streamText({
    model: genAI,
    messages: [
      {
        role: "system",
        content: systemMessage,
      },
      ...messages,
    ],
    tools: { suggestEdit },
    maxRetries: 3,
    maxSteps: 10,
    temperature: 0.7,
  })

  // Return a StreamingTextResponse, which can be consumed by the client
  return response.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error("Error in streamText:", error)
      return "An error occurred while processing your request. Please try again later."
    }
  })
}