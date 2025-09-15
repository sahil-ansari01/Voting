"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Plus, X } from "lucide-react"

interface Poll {
  question: string
  options: { id: number; text: string; votes: number }[]
  isPublished: boolean
}

interface CreatePollProps {
  onCreatePoll: (poll: Poll) => void
}

export function CreatePoll({ onCreatePoll }: CreatePollProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [isPublished, setIsPublished] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim() || options.some((opt) => !opt.trim())) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const poll: Poll = {
        question: question.trim(),
        options: options.map((text, index) => ({
          id: index + 1,
          text: text.trim(),
          votes: 0,
        })),
        isPublished,
      }

      onCreatePoll(poll)

      // Reset form
      setQuestion("")
      setOptions(["", ""])
      setIsPublished(true)
      setIsLoading(false)
    }, 1000)
  }

  const isValid = question.trim() && options.every((opt) => opt.trim()) && options.length >= 2

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="question">Poll Question</Label>
        <Textarea
          id="question"
          placeholder="What would you like to ask?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[80px]"
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Poll Options</Label>
        {options.map((option, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  required
                />
              </div>
              {options.length > 2 && (
                <Button type="button" variant="outline" size="sm" onClick={() => removeOption(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {options.length < 6 && (
          <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="publish" checked={isPublished} onCheckedChange={setIsPublished} />
        <Label htmlFor="publish">Publish immediately</Label>
      </div>

      <Button type="submit" className="w-full" disabled={!isValid || isLoading}>
        {isLoading ? "Creating Poll..." : "Create Poll"}
      </Button>
    </form>
  )
}
