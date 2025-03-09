"use client"

import { useState, useRef, useTransition, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import Link from "@tiptap/extension-link"
import { HocuspocusProvider } from '@hocuspocus/provider'
import { EditorToolbar } from "./editor-toolbar"
import { TransformerTool } from "./transformer-tool"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check, CheckCircle, Delete, Download, Loader2, MessageSquare, Plus, Trash } from "lucide-react"
import Heading from '@tiptap/extension-heading'
import Code from '@tiptap/extension-code'
import { jsPDF } from "jspdf";

import { DocumentSelect } from "@/lib/db/types"
import { Skeleton } from "../ui/skeleton"
import { saveDocument } from "@/actions/documentActions"
import { styleMarkdownHTML } from "@/lib/utils"
import { htmlStyles } from "@/lib/htmlStyles"

interface EditorProps {
  loading: boolean
  document: DocumentSelect | null
  onAddToChat: (text: string) => void
}

export function Editor({ loading, document: documentData, onAddToChat }: EditorProps) {
  const { user } = useUser()
  const providerRef = useRef<HocuspocusProvider>()
  const [editorReady, setEditorReady] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [transformerPosition, setTransformerPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTransformer, setShowTransformer] = useState(false)
  const [loadingSave, startLoadingSave] = useTransition();
  const [needsSave, setNeedsSave] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null)
  const editor = useEditor(
    {
      immediatelyRender: true,
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
      content: loading ? "Loading..." : documentData?.content || "",
      editable: !loading,
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
      onUpdate: (props) => {
        setNeedsSave(true);
        handleSaveDebounced();
      },
    },
    [editorReady, documentData, loading]
  )

  const handleSave = useCallback(() => {
    startLoadingSave(async () => {
      if (!documentData) return;
      await saveDocument(documentData.id, editor?.getHTML() || "");
      setNeedsSave(false);
    })
  }, [documentData, editor]);

  // Handle save debounced

  const debounce = (func: () => void, delay: number) => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(), delay);
    };
  }

  const handleSaveDebounced = useCallback(debounce(handleSave, 1000), [handleSave]);

  const handleDownload = useCallback(() => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const html = (documentData?.content || "") + ` ${htmlStyles}`;

    pdf.html(html, {
      callback: (pdf) => {
        pdf.save(documentData?.name + ".pdf" || "untitledDocument.pdf");
      },
      x: 10,
      y: 10,
      width: 190, // A4 width (210mm - margins)
      windowWidth: 800, // Helps with layout accuracy
    });
  }, [documentData])

  if (!providerRef.current && documentData) {
    try {
      providerRef.current = new HocuspocusProvider({
        url: 'ws://127.0.0.1:1234',
        name: `document-${documentData.id}`,
        token: 'development-token',
        onConnect: () => {
          console.log(`Conexión establecida con Hocuspocus. Document id: ${documentData?.id}`)
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
          {loading ? 
            <Skeleton className="h-8 w-32" /> : 
            <h1 className="ml-2 text-xl font-semibold">{documentData?.name || "Untitled Document"}</h1>
          }
          <p className="flex items-center gap-1">
            {loadingSave ? 
              <Loader2 className="h-4 w-4 animate-spin" /> : 
              needsSave ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />
            }
            {loadingSave ? "Saving..." : needsSave ? "Unsaved" : "Saved"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500">
            <Trash className="mr-2 h-4 w-4" />
            Delete
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
