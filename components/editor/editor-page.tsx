"use client"

import { useCallback, useState, useTransition, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { DocumentSidebar } from "@/components/sidebar/document-sidebar"
import { Editor } from "@/components/editor/editor"
import { AssistantSidebar } from "@/components/sidebar/assistant-sidebar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { DocumentInfo, DocumentSelect } from "@/lib/db/types"
import { getDocument } from "@/actions/documentActions"

function EditorPageContent() {
  const [selectedText, setSelectedText] = useState<string>("")
  const [activeDocument, setActiveDocument] = useState<DocumentSelect | null>(null)
  const [documentContext, setDocumentContext] = useState<DocumentSelect[]>([])
  const [loading, startTransition] = useTransition();

  const handleDocumentSelect = useCallback(async (document: DocumentInfo) => {
    startTransition(async () => {
      const documentData = await getDocument(document.id);
      setActiveDocument(documentData);
    })
  }, [])

  const handleRemoveDocumentContext = (documentId: string) => {
    setDocumentContext(documentContext.filter((doc) => doc.id !== documentId))
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="flex h-full">
        <div>
        <DocumentSidebar activeDocument={activeDocument} onDocumentSelect={handleDocumentSelect} />
          </div>
        
        
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
          <ResizablePanel defaultSize={70} minSize={40}>
            {activeDocument || loading ? (
              <Editor loading={loading} document={activeDocument} onAddToChat={setSelectedText} />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select or create a document to get started
              </div>
            )}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20}>
            <AssistantSidebar
              selectedText={selectedText}
              documentContext={documentContext}
              onRemoveDocumentContext={handleRemoveDocumentContext}
              activeDocument={activeDocument}
              onRemoveSelectedText={() => setSelectedText("")}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    async function checkAndCreateUser() {
      if (!user || !isLoaded) return

      try {
        // Verificar si el usuario existe
        const response = await fetch(`/api/users/${user.id}`)
        
        if (!response.ok && response.status === 404) {
          // Si el usuario no existe, lo creamos
          await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              name: user.firstName
            })
          })

          console.log('Usuario creado:', response)
        }

        console.log('Usuario creado/verificado:', user)
      } catch (error) {
        console.error('Error al verificar/crear usuario:', error)
        router.push('/error')
      }
    }

    checkAndCreateUser()
  }, [user, isLoaded, router])

  if (!isLoaded) {
    return <div>Cargando...</div>
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return <EditorPageContent />
}
