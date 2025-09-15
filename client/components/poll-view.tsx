"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, CheckCircle, TrendingUp } from "lucide-react"

interface Poll {
  id: number
  question: string
  options: { id: number; text: string; votes: number }[]
  createdBy: string
  createdAt: string
  isPublished: boolean
}

interface User {
  id: string
  name: string
  email: string
}

interface PollViewProps {
  poll: Poll
  onBack: () => void
  onVote: (pollId: number, optionId: number) => void
  user: User
}

export function PollView({ poll, onBack, onVote, user }: PollViewProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const totalVotes = poll.options.reduce((total, option) => total + option.votes, 0)

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const socket: Socket = io(API_URL, {
      transports: ["websocket", "polling"],
      upgrade: true,
      withCredentials: false,
      autoConnect: true,
      reconnection: true,
    })
    socket.on('connect', () => {
      // identify this user for unique active member counting
      socket.emit('identify', String(user.id))
      socket.emit('join_poll', String(poll.id))
    })
    socket.on('poll_results', (payload: { pollId: number; options: { id: number; text: string; votes: number }[] }) => {
      if (payload.pollId !== poll.id) return
      // Update local poll results with realtime counts
      // Note: parent state is in Dashboard; we keep a local optimistic display by mapping props
      poll.options = poll.options.map(o => {
        const updated = payload.options.find(po => po.id === o.id)
        return updated ? { ...o, votes: updated.votes } : o
      })
    })
    return () => {
      socket.emit('leave_poll', String(poll.id))
      socket.disconnect()
    }
  }, [poll.id])

  const handleVote = async (optionId: number) => {
    if (hasVoted || isVoting) return
    setIsVoting(true)
    setSelectedOption(optionId)
    try {
      await onVote(poll.id, optionId)
      setHasVoted(true)
    } catch (err: any) {
      const msg = err?.message || 'Unable to submit your vote.'
      setErrorMessage(msg)
      setErrorOpen(true)
      setSelectedOption(null)
    } finally {
      setIsVoting(false)
    }
  }

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground text-balance truncate">{poll.question}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-muted-foreground text-sm leading-5">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{totalVotes} total votes</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{formatDate(poll.createdAt)}</span>
                </span>
              </div>
            </div>
            <Badge variant={poll.isPublished ? "default" : "secondary"} className="text-sm">
              {poll.isPublished ? "Live Poll" : "Draft"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unable to record your vote</AlertDialogTitle>
                <AlertDialogDescription>
                  {errorMessage}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setErrorOpen(false)}>Okay</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!hasVoted && poll.isPublished && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Cast Your Vote</span>
                </CardTitle>
                <CardDescription>Select an option below to participate in this poll</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {poll.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedOption === option.id ? "default" : "outline"}
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => handleVote(option.id)}
                    disabled={isVoting}
                  >
                    <div className="flex items-center space-x-3">
                      {isVoting && selectedOption === option.id && (
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="text-base">{option.text}</span>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {hasVoted && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Thank you for voting!</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  Your vote has been recorded. Results are updated in real-time.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Live Results</span>
              </CardTitle>
              <CardDescription className="text-sm leading-5">Real-time voting results • {totalVotes} total votes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sortedOptions.map((option, index) => {
                const percentage = getPercentage(option.votes)
                const isWinning = index === 0 && option.votes > 0

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{option.text}</span>
                        {isWinning && (
                          <Badge variant="default" className="text-xs">
                            Leading
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground whitespace-nowrap">
                        <span>{option.votes} votes</span>
                        <span>({percentage}%)</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                )
              })}

              {totalVotes === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No votes yet. Be the first to vote!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

