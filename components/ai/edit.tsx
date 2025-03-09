import { saveDocument } from "@/actions/documentActions";
import type { DocumentSelect } from "@/lib/db/types";
import type { Editor as EditorType } from "@tiptap/react"
import { marked } from "marked";
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
                <div dangerouslySetInnerHTML={{ __html: newDocument }} />
            </div>
            <button
                onClick={async () => {
                    if (!editor) return;
                    editor.commands.setContent(await marked(newDocument));
                    await saveDocument(activeDocument.id, editor?.getHTML().split("\n").map((line, index) => {
                        return {
                            index,
                            line: line || ""
                        }
                    }) || []);
                    setIsApplied(true);
                }}
                disabled={isApplied}
                className={`flex items-center gap-2 px-3 py-1.5 ${isApplied
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