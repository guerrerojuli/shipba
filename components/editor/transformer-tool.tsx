"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquarePlus, Wand2 } from "lucide-react"

interface TransformerToolProps {
  position: { x: number; y: number }
  onTransform: (prompt: string) => void
  onAddToChat: () => void
}

export function TransformerTool({ position, onTransform, onAddToChat }: TransformerToolProps) {
  const [isTransforming, setIsTransforming] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [showPresets, setShowPresets] = useState(false)

  const presets = [
    { name: "Grammar Correction", prompt: "Fix grammar and spelling errors" },
    { name: "Summarize", prompt: "Summarize this text concisely" },
    { name: "Rewrite", prompt: "Rewrite this text" },
    { name: "Formal Tone", prompt: "Rewrite in a formal tone" },
  ]

  const handleTransform = () => {
    onTransform(prompt)
    setIsTransforming(false)
    setPrompt("")
  }

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt)
    setShowPresets(false)
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
      {!isTransforming ? (
        <div className="flex gap-1 rounded-md bg-background p-1 shadow-lg">
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsTransforming(true)}
          >
            <Wand2 className="h-3 w-3" />
            Transform
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={onAddToChat}>
            <MessageSquarePlus className="h-3 w-3" />
            Add to Chat
          </Button>
        </div>
      ) : (
        <div className="flex w-80 flex-col gap-2 rounded-md bg-background p-2 shadow-lg">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsTransforming(false)}>
              &larr;
            </Button>
            <Input
              placeholder="Enter transformation prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-8"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPresets(!showPresets)}>
              &rarr;
            </Button>
          </div>

          {showPresets && (
            <div className="mt-1 grid grid-cols-2 gap-1">
              {presets.map((preset) => (
                <Button key={preset.name} variant="outline" size="sm" onClick={() => handlePresetClick(preset.prompt)}>
                  {preset.name}
                </Button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={handleTransform} disabled={!prompt.trim()}>
              Transform
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
