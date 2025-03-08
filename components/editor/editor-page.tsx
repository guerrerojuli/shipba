"use client"

import { useCallback, useState, useTransition } from "react"
import { DocumentSidebar } from "@/components/sidebar/document-sidebar"
import { Editor } from "@/components/editor/editor"
import { AssistantSidebar } from "@/components/sidebar/assistant-sidebar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { DocumentInfo, DocumentSelect } from "@/lib/db/types"
import { getDocument } from "@/actions/documentActions"

export default function EditorPage() {
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
