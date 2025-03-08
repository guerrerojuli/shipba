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
  const [selectedText, setSelectedText] = useState("")
  const [transformerPosition, setTransformerPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTransformer, setShowTransformer] = useState(false)
  const [suggestions, setSuggestions] = useState<{ id: string; text: string }[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  
  const providerRef = useRef<HocuspocusProvider>()
  const [editorReady, setEditorReady] = useState(false)

  
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
          onClose: (error) => {
            console.error('Error de Hocuspocus:', error)
          }
        })
      } catch (error) {
        console.error("Error al inicializar Hocuspocus:", error)
        setEditorReady(true)
      }
    }

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
            openOnClick: true,
            linkOnPaste: true,
            HTMLAttributes: {
              target: '_blank',
              rel: 'noopener noreferrer',
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
                  render: user => {
                    const cursor = document.createElement('span')
                    
                    if (!user) {
                      return cursor
                    }

                    cursor.classList.add('collaboration-cursor__caret')
                    cursor.style.borderColor = user.color

                    const label = document.createElement('span')
                    label.classList.add('collaboration-cursor__label')
                    label.style.backgroundColor = user.color
                    label.textContent = user.name

                    cursor.appendChild(label)

                    return cursor
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


  const handleTransform = async (prompt: string) => {
    if (!selectedText || !editor) return

    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedText,
          prompt,
        }),
      })

      const data = await response.json()

      if (data.text) {
        // Add suggestion to the document
        const { from, to } = editor.state.selection
        const suggestionId = Date.now().toString()

        // Insert the suggestion as a span with a special class
        editor
          .chain()
          .focus()
          .insertContentAt(to, `<span class="suggestion" data-suggestion-id="${suggestionId}">${data.text}</span>`)
          .run()

        // Add to suggestions state
        setSuggestions([...suggestions, { id: suggestionId, text: data.text }])
      }
    } catch (error) {
      console.error("Error transforming text:", error)
    }

    setShowTransformer(false)
  }

  const handleAddToChat = () => {
    // This would add the selected text to the chat context
    setShowTransformer(false)
  }

  const acceptSuggestion = (id: string) => {
    if (!editor) return

    // Find the suggestion element
    const suggestionElement = window.document.querySelector(`[data-suggestion-id="${id}"]`) as HTMLElement | null
    if (suggestionElement) {
      // Replace the original text with the suggestion
      const suggestionText = suggestionElement.textContent || ""
      const { from, to } = editor.state.selection

      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, suggestionText).run()

      // Remove the suggestion
      setSuggestions(suggestions.filter((s) => s.id !== id))
    }
  }

  const rejectSuggestion = (id: string) => {
    if (!editor) return

    // Find and remove the suggestion element
    const suggestionElement = window.document.querySelector(`[data-suggestion-id="${id}"]`) as HTMLElement | null
    if (suggestionElement) {
      suggestionElement.remove()

      // Remove from suggestions state
      setSuggestions(suggestions.filter((s) => s.id !== id))
    }
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
          <TransformerTool position={transformerPosition} onTransform={handleTransform} onAddToChat={handleAddToChat} />
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="border-t p-4">
          <h3 className="mb-2 text-sm font-medium">Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-md border p-3">
                <div className="mb-2 text-sm">{suggestion.text}</div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => rejectSuggestion(suggestion.id)}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => acceptSuggestion(suggestion.id)}>
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}