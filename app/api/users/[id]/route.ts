import { db } from "@/lib/db/db"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { eq } from "drizzle-orm"
import { users } from "@/lib/db/schema"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("No autorizado", { status: 401 })
    }

    // Verificar que el usuario solo acceda a su propia información
    if (userId !== params.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    })

    if (!user) {
      return new NextResponse(null, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error al buscar usuario:", error)
    return new NextResponse("Error interno del servidor", { status: 500 })
  }
} 