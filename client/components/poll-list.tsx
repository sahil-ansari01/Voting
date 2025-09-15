"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Calendar, Trash2 } from "lucide-react"

interface Poll {
  id: number
  question: string
  options: { id: number; text: string; votes: number }[]
  creatorId: number
  createdBy: string
  createdAt: string
  isPublished: boolean
}

interface PollListProps {
  polls: Poll[]
  onSelectPoll: (poll: Poll) => void
  showActions: boolean
  onDeletePoll?: (pollId: number) => void
}

export function PollList({ polls, onSelectPoll, showActions, onDeletePoll }: PollListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getTotalVotes = (poll: Poll) => {
    return poll.options.reduce((total, option) => total + option.votes, 0)
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No polls found</h3>
        <p className="text-muted-foreground">
          {showActions ? "You haven't created any polls yet." : "No active polls available."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <Card key={poll.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-balance leading-tight">{poll.question}</CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-2">
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{getTotalVotes(poll)} votes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(poll.createdAt)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>By</span>
                    <span className="font-medium">{poll.createdBy}</span>
                  </span>
                </CardDescription>
              </div>
              <Badge variant={poll.isPublished ? "default" : "secondary"}>{poll.isPublished ? "Live" : "Draft"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {poll.options.slice(0, 3).map((option) => (
                <div key={option.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{option.text}</span>
                  <span className="font-medium">{option.votes} votes</span>
                </div>
              ))}
              {poll.options.length > 3 && (
                <div className="text-sm text-muted-foreground">+{poll.options.length - 3} more options</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onSelectPoll(poll)}
                className="w-full"
                variant={poll.isPublished ? "default" : "outline"}
              >
                {poll.isPublished ? "View & Vote" : "View Poll"}
              </Button>
              {showActions && onDeletePoll && (
                <Button type="button" variant="outline" onClick={() => onDeletePoll(poll.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
