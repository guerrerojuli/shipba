"use client"

import { KeyboardEvent, useRef, useState, useEffect } from "react"
import { X, Plus, CornerDownLeft, File, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@ai-sdk/react"
import type { DocumentSelect, DocumentInfo } from "@/lib/db/types"
import { Edit } from "../ai/edit"
import type { Editor as EditorType } from "@tiptap/react"
import { Badge } from "@/components/ui/badge"

interface AssistantSidebarProps {
  editor: EditorType | null
  selectedText: string
  documentContext: DocumentSelect[]
  onRemoveDocumentContext: (documentId: string) => void
  activeDocument: DocumentSelect | null
  setActiveDocument: (document: DocumentSelect) => void
  onRemoveSelectedText: () => void
  documents: DocumentSelect[]
  onAddToContext: (document: DocumentSelect) => void
}

export function AssistantSidebar({
  editor,
  selectedText,
  documentContext,
  onRemoveDocumentContext,
  activeDocument,
  setActiveDocument,
  onRemoveSelectedText,
  documents,
  onAddToContext
}: AssistantSidebarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, status, setMessages, error, reload } = useChat({
    body: {
      documentContext,
      activeDocument,
      selectedText,
    },
    onFinish: () => {
      scrollToBottom()
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setMessages([])
    documentContext.forEach((doc) => onRemoveDocumentContext(doc.id))
  }, [activeDocument])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && status !== "streaming") {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
      }
    }
  }

  return (
    <div className="h-full w-full flex flex-col border-l">
      <div className="flex h-12 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">Assistant</h2>
        <Button variant="ghost" size="icon" onClick={() => setMessages([])}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b p-4">
        <h3 className="mb-2 text-sm font-medium uppercase text-muted-foreground">Document Context</h3>
        <div className="flex flex-wrap gap-2">
          {documentContext.length > 0 ? (
            documentContext.map((doc) => (
              <Badge key={doc.id} variant="secondary" className="flex items-center gap-1">
                {doc.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => onRemoveDocumentContext(doc.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No context documents added</div>
          )}
          <Button variant="outline" size="sm" className="h-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
      </div>

      {/* Modal para agregar documentos al contexto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Documents to Context</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {documents.map((document) => (
                  <Button
                    key={document.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      onAddToContext(document);
                      setIsAddModalOpen(false);
                    }}
                    disabled={documentContext.some(doc => doc.id === document.id)}
                  >
                    <div className="flex items-center">
                      <File className="mr-2 h-4 w-4" />
                      <span className="truncate">{document.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              console.log(message)
              return <div
                key={message.id}
                className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                {message.toolInvocations?.map((toolInvocation) => {
                  const { toolCallId, toolName, state, args } = toolInvocation

                  console.log(toolInvocation)

                  if (toolName === "suggestEdit") {
                    if (state === "result") {
                      return <Edit
                        key={toolCallId}
                        newDocument={args.newDocument}
                        activeDocument={activeDocument || { id: "", name: "", content: [], createdAt: new Date(), userId: "", createdBy: "" }}
                        setActiveDocument={setActiveDocument}
                        editor={editor}
                      />
                    }
                  }
                })}

                {message.content && (
                  <div
                    className={`rounded-lg p-3 ${message.role === "user"
                      ? "bg-primary text-primary-foreground max-w-[80%]"
                      : "text-black-600 max-w-[100%]"
                      }`}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            })}

            {status === "streaming" && (
              <Loading bgColor="bg-muted" />
            )}

            {status === "submitted" && (
              <Loading bgColor="bg-green-100" />
            )}

            {error && (
              <div className="text-red-500 flex items-center gap-2">
                {error.message}
                <Button variant="ghost" size="icon" onClick={() => reload()}> <RefreshCcw className="h-4 w-4" /> </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t flex-shrink-0">
        {selectedText && (
          <div className="px-4 pt-4">
            <div className="rounded-md bg-muted p-2 pr-8 text-sm relative">
              {selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 absolute right-2 top-2"
                onClick={onRemoveSelectedText}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        <div className="flex gap-2 p-4">
          <Textarea
            placeholder="Send a message"
            className="min-h-[60px] resize-none"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <Button type="submit" size="icon" disabled={status === "streaming" || !input.trim()}>
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}


function Loading({ bgColor }: { bgColor: string }) {
  return (
    <div className="flex justify-start">
      <div className={`max-w-[80%] rounded-lg p-3 ${bgColor}`}>
        <div className="flex space-x-2">
          <div className={`h-2 w-2 animate-bounce rounded-full bg-black/20`}></div>
          <div
            className={`h-2 w-2 animate-bounce rounded-full bg-black/20`}
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className={`h-2 w-2 animate-bounce rounded-full bg-black/20`}
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>

  )
}