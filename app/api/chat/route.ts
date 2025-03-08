import { google } from "@ai-sdk/google"
import { streamText } from "ai"

// Create a client
const genAI = google("gemini-2.0-pro-exp-02-05")

// IMPORTANT! Set the runtime to edge
export const runtime = "edge"

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, documentContext, activeDocument } = await req.json()

  // Create context from documents
  let context = ""
  if (documentContext && documentContext.length > 0) {
    context += "Context documents:\n"
    documentContext.forEach((doc: any) => {
      context += `Title: ${doc.title}\nContent: ${doc.content}\n\n`
    })
  }

  if (activeDocument) {
    context += `Current document: ${activeDocument.title}\n${activeDocument.content}\n\n`
  }

  // Add system message with context
  const systemMessage = `You are an AI assistant helping with document editing and writing. 
  Your goal is to provide helpful, clear, and concise responses to help the user improve their documents.
  ${context ? `Here is the context you should be aware of:\n${context}` : ""}
  
  When suggesting edits, be specific and provide examples. If asked to generate content, make sure it fits the style and tone of the existing document.`


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
    maxTokens: 1000,
    temperature: 0.7,
  })


  // Return a StreamingTextResponse, which can be consumed by the client
  return response.toDataStreamResponse()
}
