import type { DocumentSelect } from "@/lib/db/types";
import type { Editor as EditorType } from "@tiptap/react"

export function Edit(
    { suggestion, activeDocument, setActiveDocument, editor }: { 
        suggestion: { index: number, line: string }[], 
        activeDocument: DocumentSelect,
        setActiveDocument: (document: DocumentSelect) => void,
        editor: EditorType | null
    }
) {
    
    return (
        <div className="max-w-[80%] rounded-lg bg-green-100 dark:bg-green-900/30 p-3 mt-2">
            <div className="max-h-[240px] overflow-y-auto mb-3">
                {suggestion.map((item) => {
                    const originalLine = activeDocument.content?.find(doc => doc.index === item.index);
                    return (
                        <div key={item.index} style={{ marginBottom: '1rem' }}>
                            <div className="mb-1">
                                <strong>Línea {item.index}:</strong>
                            </div>
                            {originalLine && (
                                <div className="pl-4 text-red-600 dark:text-red-400 line-through mb-1">
                                    {originalLine.line}
                                </div>
                            )}
                            <div className="pl-4 text-green-600 dark:text-green-400">
                                {item.line}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button 
                onClick={() => {
                    if (!editor) return;
                    
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
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
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
                Apply Changes
            </button>
        </div>
    )
}