"use client"

import { FormEvent, useCallback, useState, useTransition } from "react"
import { Plus, File, Upload, Loader2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar"
import { createDocument, uploadDocument } from "@/actions/documentActions"
import { DocumentInsert, DocumentSelect } from "@/lib/db/types"
import { Skeleton } from "../ui/skeleton"
import { useRouter } from "next/navigation"

interface DocumentSidebarProps {
  activeDocument: DocumentSelect | null
  documents: DocumentSelect[]
  loadingList: boolean
  onDocumentSelect: (document: DocumentSelect) => void
  setDocuments: (documents: DocumentSelect[]) => void
}

export function DocumentSidebar({ 
  activeDocument, 
  documents, 
  loadingList, 
  onDocumentSelect, 
  setDocuments
}: DocumentSidebarProps) {
  const { user } = useUser();
  
  const [loadingCreate, startLoadingCreate] = useTransition();
  const [loadingUpload, startLoadingUpload] = useTransition();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const router = useRouter();

  const handleCreateDocument = useCallback(async () => {
    if(documents.length >= 2 && localStorage.getItem("userSubscription") !== "pro") {
      router.push("/pricing")
      return;
    }
    startLoadingCreate(async () => {
      if (!user) return;
      const newDocument: DocumentInsert = {
        id: crypto.randomUUID(),
        name: "Untitled Document",
        createdBy: user.emailAddresses[0].emailAddress,
        content: [{index: 0, line: ""}],
        userId: user?.id,
      }
      const document = await createDocument(newDocument);
      setDocuments([...documents, document])
    })
  }, [user, documents])

  return (
    <SidebarProvider>
      <Sidebar className="h-full border-r">
      <SidebarHeader className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <div className="flex w-full justify-end absolute mr-4 -mt-1">
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
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <File className="mr-2 h-4 w-4" />
                    <span className="truncate">{document.name}</span>
                  </div>
                  <MoreVertical className="h-4 w-4" onClick={(e) => {
                    e.stopPropagation();
                    // Open dropdown menu
                  }} />
                </div>
              </Button>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>

    </SidebarProvider>
  )
}
