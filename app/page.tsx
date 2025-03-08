import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs"
import EditorPage from "@/components/editor/editor-page"

export default function Home() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <EditorPage />
}

