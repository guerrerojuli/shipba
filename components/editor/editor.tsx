"use client"

import { useState, useRef, useTransition, useCallback, useEffect } from "react"
import type { Editor as EditorType } from "@tiptap/react"
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
import { AlertCircle, CheckCircle, Download, Loader2, Trash } from "lucide-react"
import Heading from '@tiptap/extension-heading'
import Code from '@tiptap/extension-code'
import { Margin, usePDF } from "react-to-pdf"

import { DocumentSelect } from "@/lib/db/types"
import { Skeleton } from "../ui/skeleton"
import { deleteDocument, renameDocument, saveDocument } from "@/actions/documentActions"
import { styleMarkdownHTML } from "@/lib/utils"

interface EditorProps {
  loading: boolean
  document: DocumentSelect | null
  onAddToChat: (text: string) => void
  onDocumentUpdate: (document: DocumentSelect) => void
  onDocumentDelete: (document: DocumentSelect) => void
  setEditor: (editor: EditorType) => void
}


export function Editor({ 
  loading,
  document: documentData, 
  onAddToChat,
  onDocumentUpdate,
  onDocumentDelete,
  setEditor
}: EditorProps) {
  const { user } = useUser()
  const { toPDF, targetRef } = usePDF({
    filename: documentData?.name || "untitledDocument.pdf",
    page: {
      margin: Margin.NONE,
      format: "letter",
      orientation: "portrait",
    },
    method: "save"
  });
  const providerRef = useRef<HocuspocusProvider>()
  const [editorReady, setEditorReady] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [transformerPosition, setTransformerPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTransformer, setShowTransformer] = useState(false)
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(documentData?.name || "Untitled Document");
  const [loadingSave, startLoadingSave] = useTransition();
  const [loadingDelete, startLoadingDelete] = useTransition();
  const [loadingDownload, startLoadingDownload] = useTransition();
  const [needsSave, setNeedsSave] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null)
  const editNameRef = useRef<HTMLInputElement>(null)
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
      content: loading ? "Loading..." : documentData?.content.map((data) => data.line).join("<br />") || "",
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

  useEffect(() => {
    setNewName(documentData?.name || "Untitled Document")
  }, [documentData])

  const handleSave = useCallback(() => {
    startLoadingSave(async () => {
      if (!documentData) return;
      await saveDocument(documentData.id, editor?.getHTML().split("\n").map((line, index) => {
        return {
          index,
          line: line || ""
        }
      }) || []);
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

  const handleDelete = useCallback(() => {
    startLoadingDelete(async () => {
      if (!documentData) return;
      deleteDocument(documentData.id);
      onDocumentDelete(documentData);
    })
  }, [documentData])

  useEffect(() => {
    if (editor) {
      setEditor(editor)
    }
  }, [editor])

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

  const handleDownload = () => {
    console.log(styleMarkdownHTML(editor?.getHTML() || ""))
    toPDF()
  }

  const handleRename = useCallback(async (newname: string) => {
    startLoadingSave(async () => {
      if (!documentData) return;
      await renameDocument(documentData.id, newname);
      setEditingName(false)
      onDocumentUpdate({...documentData, name: newname})
    })
  }, [documentData, setEditingName])

  return (
    <>
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          {loading ? 
            <Skeleton className="h-8 w-32" /> : 
            !editingName ? 
              <h1 className="ml-2 text-xl font-semibold" onClick={() => {setEditingName(true)}}>{newName}</h1> :
              <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                handleRename(newName)
                editNameRef.current?.blur()
              }}>
                <input ref={editNameRef} autoFocus type="text" name="newname" className="ml-2 text-xl font-semibold" value={newName} onChange={(e) => {setNewName(e.target.value)}} onBlur={(e) => {handleRename(newName)}} />
              </form>
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
          <Button variant="ghost" size="sm" onClick={() => handleDownload()}>
            {loadingDownload ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={handleDelete}>
            {loadingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
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
    <div ref={targetRef} className="absolute top-[9999px] left-[9999px] p-8" dangerouslySetInnerHTML={{ __html: styleMarkdownHTML(editor?.getHTML() || "") }}></div>
    </>
  )
}
