"use client"

import { useState } from "react"
import { Plus, File, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Document } from "@/types/document"
import { useUser } from "@clerk/nextjs"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar"

interface DocumentSidebarProps {
  activeDocument: Document | null
  onDocumentSelect: (document: Document) => void
}

export function DocumentSidebar({ activeDocument, onDocumentSelect }: DocumentSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", title: "Getting Started", content: "Welcome to the AI-powered document editor!" },
  ])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const handleCreateDocument = () => {
    const newDocument: Document = {
      id: Date.now().toString(),
      title: "Untitled Document",
      content: "",
    }
    setDocuments([...documents, newDocument])
    onDocumentSelect(newDocument)
  }

  const handleUploadDocument = (file: File) => {
    // In a real app, this would process the file and extract content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const newDocument: Document = {
        id: Date.now().toString(),
        title: file.name,
        content: content || "Failed to load content",
      }
      setDocuments([...documents, newDocument])
      onDocumentSelect(newDocument)
    }
    reader.readAsText(file)
    setIsUploadModalOpen(false)
  }

  return (
    <SidebarProvider>
      <Sidebar className="h-full border-r">
        <SidebarHeader className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCreateDocument}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="h-[calc(100%-4rem)] overflow-auto">
          <div className="space-y-1 p-2">
            {documents.map((document) => (
              <Button
                key={document.id}
                variant={activeDocument?.id === document.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onDocumentSelect(document)}
              >
                <File className="mr-2 h-4 w-4" />
                <span className="truncate">{document.title}</span>
              </Button>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6">
            <h3 className="mb-4 text-lg font-semibold">Upload Document</h3>
            <Input
              type="file"
              accept=".txt,.md,.docx,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleUploadDocument(file)
                }
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button>Upload</Button>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  )
}
