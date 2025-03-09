import type { DocumentSelect } from "@/lib/db/types";
import type { Editor as EditorType } from "@tiptap/react"
import { useState } from "react";

export function Edit(
    { newDocument, activeDocument, setActiveDocument, editor }: { 
        newDocument: string, 
        activeDocument: DocumentSelect,
        setActiveDocument: (document: DocumentSelect) => void,
        editor: EditorType | null
    }
) {
    const [isApplied, setIsApplied] = useState(false);

    return (
        <div className="max-w-[80%] rounded-lg bg-green-100 dark:bg-green-900/30 p-3 mt-2">
            <div className="max-h-[240px] overflow-y-auto mb-3">
                {newDocument}
            </div>
            <button 
                onClick={() => {
                    if (!editor) return;
<<<<<<< HEAD
                    editor.commands.setContent(newDocument);
                    setIsApplied(true);
=======
                    
                    // Ordenar las sugerencias por índice en orden ascendente
                    const sortedSuggestions = [...suggestion].sort((a, b) => a.index - b.index);
                    
                    // Aplicar los cambios al editor
                    sortedSuggestions.forEach(item => {
                        const doc = editor.state.doc;
                        let lineStart = 0;
                        let lineEnd = 0;
                        let currentLine = 0;
                        
                        doc.descendants((node, pos) => {
                            if (currentLine === item.index) {
                                lineStart = pos;
                                lineEnd = pos + node.nodeSize;
                                return false;
                            }
                            currentLine++;
                            return true;
                        });

                        if (lineStart !== lineEnd) {
                            editor
                                .chain()
                                .focus()
                                .deleteRange({ from: lineStart, to: lineEnd })
                                .insertContentAt(lineStart, item.line)
                                .run();
                        } else {
                            editor
                                .chain()
                                .focus()
                                .insertContentAt(editor.state.doc.content.size, "\n" + item.line)
                                .run();
                        }

                        console.log("EDITOR STATE:", editor.state.doc.content);
                    });

                    // Actualizar el estado del documento
                    const updatedContent = editor.getJSON().content
                        ?.filter(data => data.content)
                        .map((data, index) => ({
                            index,
                            line: data.content?.[0]?.text || ""
                        })) || [];

                    setActiveDocument({
                        ...activeDocument,
                        content: updatedContent
                    });
>>>>>>> ee5ad78 (Chat functionality broken)
                }}
                disabled={isApplied}
                className={`flex items-center gap-2 px-3 py-1.5 ${
                    isApplied 
                        ? 'bg-green-700 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                } text-white rounded-md transition-colors`}
            >
                <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                    />
                </svg>
                {isApplied ? 'Applied' : 'Apply Changes'}
            </button>
        </div>
    )
}