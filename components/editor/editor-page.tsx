"use client"

import { useState } from "react"
import { DocumentSidebar } from "@/components/sidebar/document-sidebar"
import { Editor } from "@/components/editor/editor"
import { AssistantSidebar } from "@/components/sidebar/assistant-sidebar"
import type { Document } from "@/types/document"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export default function EditorPage() {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null)
  const [selectedText, setSelectedText] = useState<string>("")
  const [documentContext, setDocumentContext] = useState<Document[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleDocumentSelect = (document: Document) => {
    setActiveDocument(document)
  }

  const handleTextSelect = (text: string) => {
    setSelectedText(text)
  }

  const handleAddDocumentContext = (document: Document) => {
    if (!documentContext.some((doc) => doc.id === document.id)) {
      setDocumentContext([...documentContext, document])
    }
  }

  const handleRemoveDocumentContext = (documentId: string) => {
    setDocumentContext(documentContext.filter((doc) => doc.id !== documentId))
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="flex h-full">
        <div>
        <DocumentSidebar activeDocument={activeDocument} onDocumentSelect={handleDocumentSelect} />
          </div>
        
        
        <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
          <ResizablePanel defaultSize={70} minSize={40}>
            {activeDocument ? (
              <Editor document={activeDocument} onTextSelect={handleTextSelect} />
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
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
