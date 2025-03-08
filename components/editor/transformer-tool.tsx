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
      {
        state === "menu" && (
          <div className="flex gap-2 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-2 shadow-lg border">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-muted" onClick={() => setState("prompt")}>
              <Wand2 className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-muted" onClick={() => onAddToChat()}>
              <MessageSquarePlus className="h-4 w-4" />
              Add to Chat
            </Button>
          </div>
        )
      }
      {
        state === "prompt" && (
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-2 shadow-lg border"
          >
            <div className="flex flex-col gap-2">
              <Select onValueChange={(value) => setPrompt(presets.find(p => p.name === value)?.prompt || "")}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={prompt}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter a prompt"
                disabled={isLoading}
                className="min-w-[300px] min-h-[100px] resize-y"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-muted"
                disabled={isLoading}
              >
                <Wand2 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-muted"
                onClick={() => setState("menu")}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )
      }
      {
        state === "confirmation" && (
          <div className="flex gap-2 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-2 shadow-lg border">
            <Textarea
              value={edit}
              disabled={true}
              className="min-w-[300px] min-h-[100px] resize-y overflow-auto"
            />
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-muted"
                onClick={() => setText(edit)}
                disabled={isLoading}
              >
                Accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 hover:bg-muted"
                onClick={() => setState("menu")}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      }
    </div>
  )
}