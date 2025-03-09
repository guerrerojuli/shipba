"use client"

import { useCallback, useState, useTransition, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import type { Editor as EditorType } from "@tiptap/react"
import { useRouter } from "next/navigation"
import { DocumentSidebar } from "@/components/sidebar/document-sidebar"
import { Editor } from "@/components/editor/editor"
import { AssistantSidebar } from "@/components/sidebar/assistant-sidebar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { DocumentInfo, DocumentSelect } from "@/lib/db/types"
import { getDocument, getDocumentList } from "@/actions/documentActions"
import { Skeleton } from "../ui/skeleton"

function EditorContent() {
  const [editor, setEditor] = useState<EditorType | null>(null)
  const [selectedText, setSelectedText] = useState<string>("")
  const [activeDocument, setActiveDocument] = useState<DocumentSelect | null>(null)
  const [documentContext, setDocumentContext] = useState<DocumentSelect[]>([])
  const [documents, setDocuments] = useState<DocumentSelect[]>([])
  const [loading, startTransition] = useTransition();
  const [loadingList, startLoadingList] = useTransition();

  useEffect(() => {
    const fetchDocuments = async () => {
      startLoadingList(async () => {
        const documents = await getDocumentList();
        const allDocuments = await Promise.all(documents.map(async (document) => {
          const documentData = await getDocument(document.id);
          return documentData;
        }));
        setDocuments(allDocuments);
      })
    };
    fetchDocuments();
  }, []);

  const handleAddToContext = useCallback((document: DocumentSelect) => {
    if (!documentContext.find(doc => doc.id === document.id)) {
      setDocumentContext([...documentContext, document]);
    }
  }, [documentContext]);

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
          <DocumentSidebar 
          loadingList={loadingList} 
          documents={documents} 
          setDocuments={setDocuments} 
          activeDocument={activeDocument} 
          onDocumentSelect={handleDocumentSelect} 
          />
        </div>
        
        
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
          <ResizablePanel defaultSize={70} minSize={40}>
            {activeDocument ? (
              <Editor
                loading={loading}
                document={activeDocument}
                onAddToChat={setSelectedText}
                onDocumentUpdate={(document) => {
                  setDocuments(documents.map((doc) => doc.id === document.id ? document : doc))
                }}
                onDocumentDelete={(document) => {
                  setDocuments(documents.filter((doc) => doc.id !== document.id));
                  setActiveDocument(null);
                }}
                setEditor={setEditor}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select or create a document to get started
              </div>
            )}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20}>
            <AssistantSidebar
              editor={editor}
              selectedText={selectedText}
              documentContext={documentContext}
              onRemoveDocumentContext={handleRemoveDocumentContext}
              activeDocument={activeDocument}
              setActiveDocument={setActiveDocument}
              onRemoveSelectedText={() => setSelectedText("")}
              documents={documents}
              onAddToContext={handleAddToContext}
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
    return (
      <div className="h-screen flex flex-col">
        <div className="h-12 border-b flex items-center px-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex-1 flex">
          {/* Sidebar izquierdo */}
          <div className="w-64 border-r">
            <div className="h-12 border-b px-4 flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
          
          {/* Editor central */}
          <div className="flex-1 flex flex-col">
            <div className="h-12 border-b flex items-center px-4">
              <Skeleton className="h-6 w-64" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </div>
          </div>
          
          {/* Sidebar derecho */}
          <div className="w-72 border-l">
            <div className="h-12 border-b px-4 flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return <EditorContent />
}
