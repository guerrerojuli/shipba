import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { z } from "zod"
import type { Message } from "ai"
import type { DocumentSelect } from "@/lib/db/types"


const suggestEdit = tool({
  description: "Suggest an edit to the document",
  parameters: z.object({
    suggestion: z.array(
      z.object({
        index: z.number().describe("The line number of the edit"),
        line: z.string().describe("The new line of text to replace the old line"),
      }).describe("A suggested edit to the document")
    ).describe("An array of suggested edits to the document"),
  }),
  execute: async ({ suggestion }) => {
    console.log("Tool executed with suggestion:", suggestion)
    return { success: true, suggestions: suggestion }
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

  // Add system message with context
  const systemMessage = `
  You are an AI assistant specialized in document editing, writing, translation, and analysis. You have access to a suggestEdit tool that allows you to suggest specific edits to multiple lines of a document simultaneously.
  
  When suggesting edits:
  1. Use the suggestEdit tool once per request, grouping all line changes into one single execution.
  2. Each suggestion within the execution must specify clearly:
     - index: the exact line number to change
     - line: the new line content
  3. Clearly explain each edit after executing suggestEdit.
  
  GUIDELINES:
  - You can translate text as part of editing tasks when explicitly requested by the user.
  - Prioritize edits that improve clarity, readability, style, and correctness.
  - Preserve the original meaning, intention, style, and tone of the document unless explicitly asked otherwise.
  - Provide specific, actionable suggestions, always clearly justified.
  
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
    maxTokens: 1000,
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