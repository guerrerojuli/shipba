"use client"

import { useState, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Link from "@tiptap/extension-link"
import { HocuspocusProvider } from '@hocuspocus/provider'
import type { Document as AppDocument } from "@/types/document"
import { EditorToolbar } from "./editor-toolbar"
import { TransformerTool } from "./transformer-tool"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus } from "lucide-react"
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Highlight from '@tiptap/extension-highlight'
import Heading from '@tiptap/extension-heading'
import Code from '@tiptap/extension-code'


interface EditorProps {
  document: AppDocument
  onAddToChat: (text: string) => void
}

export function Editor({ document: documentData, onAddToChat }: EditorProps) {
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
        Heading.configure({
          levels: [1, 2, 3],
        }),
        Code.configure({
          HTMLAttributes: {
            class: 'editor-code',
          },
        }),
        Placeholder.configure({
          placeholder: "Start writing or upload a document...",
        }),
        Link.configure({
          openOnClick: true,
          linkOnPaste: true,
          HTMLAttributes: {
            class: 'text-blue-500',
          },
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

          // Calculate position for transformer
          if (editorRef.current) {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              const rect = range.getBoundingClientRect()
              const editorRect = editorRef.current.getBoundingClientRect()
              const scrollTop = editorRef.current.scrollTop

              // Calculate initial position
              let x = rect.left - editorRect.left + rect.width / 2
              let y = rect.bottom - editorRect.top + scrollTop + 10

              // Ensure the transformer doesn't go outside the editor bounds
              const maxX = editorRect.width - 20 // Leave some padding
              const maxY = editorRect.height - 20

              x = Math.max(20, Math.min(x, maxX)) // Keep within horizontal bounds
              y = Math.max(20, Math.min(y, maxY)) // Keep within vertical bounds

              setTransformerPosition({ x, y })
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
    onAddToChat(selectedText)
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
        <EditorContent  editor={editor} className="min-h-full w-full p-4" />

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
            onClose={() => {
              setShowTransformer(false)
            }}
            activeDocument={documentData}
          />
        )}
      </div>
    </div>
  )
}
