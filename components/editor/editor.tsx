"use client"

import { useState, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Link from "@tiptap/extension-link"
import { HocuspocusProvider } from '@hocuspocus/provider'
import type { Document } from "@/types/document"
import { EditorToolbar } from "./editor-toolbar"
import { TransformerTool } from "./transformer-tool"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus } from "lucide-react"

interface EditorProps {
  document: Document
  onTextSelect: (text: string) => void
}

export function Editor({ document: documentData, onTextSelect }: EditorProps) {
  const { user } = useUser()
  const providerRef = useRef<HocuspocusProvider>()
  const [editorReady, setEditorReady] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [transformerPosition, setTransformerPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTransformer, setShowTransformer] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Placeholder.configure({
          placeholder: "Start writing or upload a document...",
        }),
        Link.configure({
          openOnClick: false,
          linkOnPaste: true,
        }),
        ...(editorReady && providerRef.current
          ? [
            Collaboration.configure({
              document: providerRef.current.document,
            }),
            CollaborationCursor.configure({
              provider: providerRef.current,
              user: {
                name: user?.fullName || "Anonymous",
                color: "#" + Math.floor(Math.random() * 16777215).toString(16),
              },
            }),
          ]
          : []),
      ],
      content: documentData.content,
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, " ")
          setSelectedText(text)
          onTextSelect(text)

          // Calculate position for transformer
          if (editorRef.current) {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              const rect = range.getBoundingClientRect()
              const editorRect = editorRef.current.getBoundingClientRect()

              setTransformerPosition({
                x: rect.left - editorRect.left + rect.width / 2,
                y: rect.bottom - editorRect.top + 10,
              })
              setShowTransformer(true)
            }
          }
        } else {
          setShowTransformer(false)
        }
      },
    },
    [editorReady]
  )


  if (!providerRef.current) {
    try {
      providerRef.current = new HocuspocusProvider({
        url: 'ws://127.0.0.1:1234',
        name: `document-${documentData.id}`,
        token: 'development-token',
        onConnect: () => {
          console.log(`Conexión establecida con Hocuspocus. Document id: ${documentData.id}`)
          setEditorReady(true)
        },
        onDisconnect: () => {
          console.log('Desconectado de Hocuspocus')
        },
        onClose: (data: any) => {
          console.error('Error de Hocuspocus:', data)
        }
      })
    } catch (error) {
      console.error("Error al inicializar Hocuspocus:", error)
      setEditorReady(true)
    }
  }

  const handleAddToChat = () => {
    // This would add the selected text to the chat context
    setShowTransformer(false)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{documentData.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
          <Button variant="ghost" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Research
          </Button>
          <Button variant="ghost" size="sm">
            Copy
          </Button>
        </div>
      </div>

      <EditorToolbar editor={editor} />

      <div className="relative flex-1 w-full overflow-auto" ref={editorRef}>
        <EditorContent editor={editor} className="min-h-full w-full p-4" />

        {showTransformer && transformerPosition && (
          <TransformerTool 
            position={transformerPosition} 
            selectedText={selectedText}
            setText={(text: string) => {
              if (!editor) return
              const { from, to } = editor.state.selection
              editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, text).run()
            }}
            onAddToChat={handleAddToChat}
          />
        )}
      </div>
    </div>
  )
}
