import { db } from "@/lib/db/db"
import { users } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clerkId, email, name } = body

    if (!clerkId || !email) {
      return new NextResponse("Faltan datos requeridos", { status: 400 })
    }

    const user = await db.insert(users).values({
      id: clerkId,
      email,
      name: name || "",
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return new NextResponse("Error interno del servidor", { status: 500 })
  }
} 