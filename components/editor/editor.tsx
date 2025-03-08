"use client"

import { useState, useRef, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Link from "@tiptap/extension-link"
import { HocuspocusProvider, TiptapCollabProvider } from '@hocuspocus/provider'
import type { Document } from "@/types/document"
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
import * as Y from 'yjs'


interface EditorProps {
  document: Document
  onTextSelect: (text: string) => void
}

export function Editor({ document: documentData, onTextSelect }: EditorProps) {
  const { user } = useUser()
  const doc = new Y.Doc() // Initialize Y.Doc for shared editing
  const provider = new TiptapCollabProvider({
    appId: 'y9drlw8m',          // Reemplaza con el ID de tu aplicación desde Tiptap Cloud
    name: `Test Doc ${user?.id}`,    // Un identificador único para el documento (p.ej., un UUID)
    token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDE0NzcxMjQsIm5iZiI6MTc0MTQ3NzEyNCwiZXhwIjoxNzQxNTYzNTI0LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJ5OWRybHc4bSJ9.aaKIgmOU6drtOCMXAtZV0VSrUJzC2cHj9472ToqmmWM',
    document: doc,         // El documento Yjs compartido
  });
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
        // Document,
        Paragraph,
        Text,
        Collaboration.configure({
          document: provider.document, // Configure Y.Doc for collaboration
        }),
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
  )

  useEffect(() => {
    const provider = new TiptapCollabProvider({
      name: 'document.name', // Unique document identifier for syncing. This is your document name.
      appId: '7j9y6m10', // Your Cloud Dashboard AppID or `baseURL` for on-premises
      token: "asd", // Your JWT token
      document: doc,
    })
  }, [])


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
