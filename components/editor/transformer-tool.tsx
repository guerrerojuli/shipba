"use client"

import { useState, useTransition } from "react"
import { MessageSquarePlus, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TransformerToolProps {
  position: { x: number; y: number }
  selectedText: string
  setText: (text: string) => void
  onAddToChat: () => void
}

const presets = [
  { name: "Grammar Correction", prompt: "Fix grammar and spelling errors" },
  { name: "Summarize", prompt: "Summarize this text concisely" },
  { name: "Rewrite", prompt: "Rewrite this text" },
  { name: "Formal Tone", prompt: "Rewrite in a formal tone" },
]


export function TransformerTool({
  position,
  selectedText,
  setText,
  onAddToChat,
}: TransformerToolProps) {
  const [prompt, setPrompt] = useState<string>("")
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [state, setState] = useState<"menu" | "prompt" | "confirmation">("menu")
  const [edit, setEdit] = useState<string>("")
  const [isLoading, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(async () => {
      const response = await fetch("/api/transform", {
        method: "POST",
        body: JSON.stringify({ text: selectedText, prompt }),
      })

      const data = await response.json()

      setEdit(data.text)
      setState("confirmation")
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setPrompt(e.target.value)
    setSelectedPreset("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) form.requestSubmit()
    }
  }

  return (
    <div
      className="absolute z-10 flex"
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-50%)",
      }}
    >
      {state === "menu" && (
        <div className="flex flex-col gap-2 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-3 shadow-lg border min-w-[200px]">
          <div className="text-sm font-medium mb-1">Edit Selection</div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setState("prompt")}>
              <Wand2 className="h-4 w-4 mr-2" />
              Edit Text
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => onAddToChat()}>
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Add to Chat
            </Button>
          </div>
        </div>
      )}
      {state === "prompt" && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-3 shadow-lg border"
        >
          <div className="text-sm font-medium">Edit Text</div>
          <div className="space-y-3">
            <Select 
              value={selectedPreset}
              onValueChange={(value) => {
                setSelectedPreset(value)
                setPrompt(presets.find(p => p.name === value)?.prompt || "")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an edit type..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {selectedPreset ? "Preset prompt (edit to customize)" : "Custom prompt"}
              </div>
              <Textarea
                value={prompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter instructions..."
                disabled={isLoading}
                className="min-w-[300px] min-h-[100px] resize-y"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setState("menu")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </form>
      )}
      {state === "confirmation" && (
        <div className="flex flex-col gap-3 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-3 shadow-lg border">
          <div className="text-sm font-medium">Review Changes</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Original Text:</div>
              <div className="rounded-md bg-muted/50 p-2 text-sm text-red-500">
                {selectedText}
              </div>
            </div>
            <div>
            <div className="text-xs text-muted-foreground mb-2">Original Text:</div>
              <div className="rounded-md bg-muted/50 p-2 text-sm text-green-500">
                {edit}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState("menu")}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setText(edit)}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}