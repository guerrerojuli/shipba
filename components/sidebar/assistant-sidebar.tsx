"use client"

import { KeyboardEvent, useRef } from "react"
import { X, Plus, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@ai-sdk/react"
import type { DocumentSelect } from "@/lib/db/types"
import { Edit } from "../ai/edit"
import type { Editor as EditorType } from "@tiptap/react"

interface AssistantSidebarProps {
  editor: EditorType | null
  selectedText: string
  documentContext: DocumentSelect[]
  onRemoveDocumentContext: (documentId: string) => void
  activeDocument: DocumentSelect | null
  setActiveDocument: (document: DocumentSelect) => void
  onRemoveSelectedText: () => void
}

export function AssistantSidebar({
  editor,
  selectedText,
  documentContext,
  onRemoveDocumentContext,
  activeDocument,
  setActiveDocument,
  onRemoveSelectedText,
}: AssistantSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
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
        <Button variant="ghost" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b p-4">
        <h3 className="mb-2 text-sm font-medium uppercase text-muted-foreground">Document Context</h3>
        <div className="flex flex-wrap gap-2">
          {documentContext.length > 0 ? (
            documentContext.map((doc) => (
              /*
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
              */
             <div>a</div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No context documents added</div>
          )}
          <Button variant="outline" size="sm" className="h-6">
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
      </div>

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

                  if (toolName === "suggestEdit" && state === "result") {
                    return <Edit key={toolCallId} suggestion={args.suggestion} activeDocument={activeDocument || {id: "", name: "", content: [], createdAt: new Date(), userId: "", createdBy: ""}} setActiveDocument={setActiveDocument} editor={editor}/>
                  }
                })}

                {message.content && (
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                  >
                    {message.content}
                  </div>
                )}
              </div>
            })}

            {status === "streaming" && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted p-3">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
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
