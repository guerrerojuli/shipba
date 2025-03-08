import { google } from "@ai-sdk/google"
import { generateText, streamText } from "ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { text, prompt } = await req.json()
    console.log("text: " + text)
    console.log("prompt: " + prompt)

    if (!text || !prompt) {
      return NextResponse.json(
        { error: "Text and prompt are required" },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert writer and markdown specialist.
Your task is to help transform and improve markdown text based on the user's request.
Always maintain the original meaning and content while making the requested improvements.
Follow markdown best practices and ensure proper formatting.
Be clear and concise in your writing style.

Original text:
"""
${text}
"""

Transformation request: ${prompt}

Provide only the transformed markdown text without any additional explanations or comments.
Don't add any other text or comments to the output. Do not add \`\`\`markdown to the output.
`

    // Generate content
    const result = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: systemPrompt,
    })

    return NextResponse.json({ text: result.text })
  } catch (error) {
    console.error("Error in transform route:", error)
    return NextResponse.json(
      { error: "Failed to process transformation request" },
      { status: 500 }
    )
  }
}
