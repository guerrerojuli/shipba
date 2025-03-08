import { GoogleGenerativeAI } from "@google/generative-ai"

// Create a client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

export async function POST(req: Request) {
  const { text, prompt } = await req.json()

  if (!text || !prompt) {
    return Response.json({ error: "Text and prompt are required" }, { status: 400 })
  }

  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Generate content
    const result = await model.generateContent(`
      You are an AI assistant helping with document editing.
      
      Original text:
      """
      ${text}
      """
      
      User instruction: ${prompt}
      
      Provide only the transformed text without any additional explanations or comments.
    `)

    const response = result.response
    const transformedText = response.text()

    return Response.json({ text: transformedText })
  } catch (error) {
    console.error("Error transforming text:", error)
    return Response.json({ error: "Failed to transform text" }, { status: 500 })
  }
}
