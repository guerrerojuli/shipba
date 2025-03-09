"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Plus, File, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar"
import { createDocument, getDocumentList } from "@/actions/documentActions"
import { DocumentInfo, DocumentInsert } from "@/lib/db/types"
import { Skeleton } from "../ui/skeleton"
import { useRouter } from "next/navigation"

interface DocumentSidebarProps {
  activeDocument: DocumentInfo | null
  onDocumentSelect: (document: DocumentInfo) => void
}

export function DocumentSidebar({ activeDocument, onDocumentSelect }: DocumentSidebarProps) {
  const { user } = useUser();
  const [loadingList, startLoadingList] = useTransition();
  const [loadingCreate, startLoadingCreate] = useTransition();
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      startLoadingList(async () => {
        const documents = await getDocumentList();
        setDocuments(documents);
      })
    };
    fetchDocuments();
  }, []);

  const handleCreateDocument = useCallback(async () => {
    if(documents.length >= 1 && localStorage.getItem("userSubscription") !== "pro") {
      router.push("/pricing")
      return;
    }
    startLoadingCreate(async () => {
      if (!user) return;
      const newDocument: DocumentInsert = {
        id: crypto.randomUUID(),
        name: "Untitled Document",
        createdBy: user.emailAddresses[0].emailAddress,
        content: [],
        userId: user?.id,
      }
      const document = await createDocument(newDocument);
      setDocuments([...documents, document])
    })
  }, [user, documents])

  const handleUploadDocument = (file: File) => {
    if(documents.length >= 1 && localStorage.getItem("userSubscription") !== "pro") {
      router.push("/pricing")
      return;
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      console.log(content);
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
            <Button variant="ghost" size="icon" onClick={() => {handleCreateDocument();}}>
              {loadingCreate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="h-[calc(100%-4rem)] overflow-auto">
          <div className="space-y-1 p-2">
            {loadingList ? <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </> : documents.map((document) => (
              <Button
                key={document.id}
                variant={activeDocument?.id === document.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onDocumentSelect(document)}
              >
                <File className="mr-2 h-4 w-4" />
                <span className="truncate">{document.name}</span>
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
