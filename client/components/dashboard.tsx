"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { apiCreatePoll, apiListPolls, apiCreateVote, apiGetPoll, apiDeletePoll } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatePoll } from "@/components/create-poll"
import { PollList } from "@/components/poll-list"
import { PollView } from "@/components/poll-view"
import { LogOut, Plus, BarChart3, Vote } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
}

interface PollOption { id: number; text: string; votes: number }
interface Poll {
  id: number
  question: string
  options: PollOption[]
  creatorId: number
  createdBy: string
  createdAt: string
  isPublished: boolean
}

interface DashboardProps {
  user: User
  onLogout: () => void
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("polls")
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [polls, setPolls] = useState<Poll[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [activeUsers, setActiveUsers] = useState<number>(0)

  // Load polls from backend
  useEffect(() => {
    let mounted = true
    apiListPolls()
      .then(async apiPolls => {
        if (!mounted) return
        // Fetch each poll with counts so dashboard shows live numbers
        const withCounts = await Promise.all(apiPolls.map(async p => {
          try {
            const full = await apiGetPoll(p.id)
            return {
              id: full.id,
              question: full.question,
              options: (full.options || []).map(o => ({ id: o.id, text: o.text, votes: (o as any)._count?.votes ?? (o as any).votes ?? 0 })),
              creatorId: Number(full.creator?.id || 0),
              createdBy: full.creator?.name || String(full.creator?.id || ''),
              createdAt: full.createdAt || new Date().toISOString(),
              isPublished: full.isPublished,
            } as Poll
          } catch {
            return {
              id: p.id,
              question: p.question,
              options: (p.options || []).map(o => ({ id: o.id, text: o.text, votes: 0 })),
              creatorId: Number(p.creator?.id || 0),
              createdBy: p.creator?.name || String(p.creator?.id || ''),
              createdAt: p.createdAt || new Date().toISOString(),
              isPublished: p.isPublished,
            } as Poll
          }
        }))
        setPolls(withCounts)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  // Establish socket once, listen to global events, and update state
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const socket: Socket = io(API_URL, { transports: ["websocket", "polling"], reconnection: true })
    socketRef.current = socket
    socket.on('connect', () => {
      // join existing polls for live results
      polls.forEach(p => socket.emit('join_poll', String(p.id)))
    })
    socket.on('poll_results', (payload: { pollId: number; options: { id: number; text: string; votes: number }[] }) => {
      setPolls(prev => prev.map(p => p.id === payload.pollId ? {
        ...p,
        options: p.options.map(o => {
          const u = payload.options.find(x => x.id === o.id)
          return u ? { ...o, votes: u.votes } : o
        })
      } : p))
    })
    socket.on('active_users', (payload: { count: number }) => {
      setActiveUsers(payload.count)
    })
    socket.on('poll_created', (payload: { id: number; question: string; isPublished: boolean; createdAt?: string; creator?: { id: number; name: string }; options: { id: number; text: string; votes?: number }[] }) => {
      setPolls(prev => {
        if (prev.some(p => p.id === payload.id)) return prev
        const newPoll: Poll = {
          id: payload.id,
          question: payload.question,
          isPublished: payload.isPublished,
          createdAt: payload.createdAt || new Date().toISOString(),
          creatorId: Number(payload.creator?.id || 0),
          createdBy: payload.creator?.name || String(payload.creator?.id || ''),
          options: (payload.options || []).map(o => ({ id: o.id, text: o.text, votes: o.votes ?? 0 })),
        }
        // Join the new poll room for future live updates
        socket.emit('join_poll', String(newPoll.id))
        return [newPoll, ...prev]
      })
    })
    socket.on('poll_deleted', (payload: { id: number }) => {
      setPolls(prev => prev.filter(p => p.id !== payload.id))
    })
    return () => {
      try {
        polls.forEach(p => socket.emit('leave_poll', String(p.id)))
        socket.disconnect()
      } catch {}
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the set of polls changes, ensure we have joined their rooms
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    polls.forEach(p => socket.emit('join_poll', String(p.id)))
  }, [polls.map(p => p.id).join(',')])

  const handleCreatePoll = async (newPoll: { question: string; options: { id: number; text: string; votes: number }[]; isPublished: boolean }) => {
    const created = await apiCreatePoll({
      creatorId: Number(user.id),
      question: newPoll.question,
      options: newPoll.options.map(o => o.text),
      isPublished: newPoll.isPublished,
    })
    const mapped: Poll = {
      id: created.id,
      question: created.question,
      options: (created.options || []).map(o => ({ id: o.id, text: o.text, votes: 0 })),
      creatorId: Number(created.creator?.id || user.id),
      createdBy: created.creator?.name || String(created.creator?.id || user.id),
      createdAt: created.createdAt || new Date().toISOString(),
      isPublished: created.isPublished,
    }
    setPolls([mapped, ...polls])
    setActiveTab("polls")
  }

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      await apiCreateVote({ userId: Number(user.id), pollOptionId: optionId })
      setPolls(prev => prev.map(p => p.id === pollId ? {
        ...p,
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
      } : p))
    } catch (err: any) {
      throw err
    }
  }

  if (selectedPoll) {
    return <PollView poll={selectedPoll} onBack={() => setSelectedPoll(null)} onVote={(pid, oid) => handleVote(pid, oid)} user={user} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Vote className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">PollHub</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Active members: {activeUsers}</span>
            <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="polls" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Polls</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </TabsTrigger>
            <TabsTrigger value="my-polls" className="flex items-center space-x-2">
              <Vote className="w-4 h-4" />
              <span>My Polls</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="polls" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Polls</CardTitle>
                <CardDescription>Participate in live polls and see real-time results</CardDescription>
              </CardHeader>
              <CardContent>
                <PollList
                  polls={polls.filter((poll) => poll.isPublished)}
                  onSelectPoll={(p) => setSelectedPoll(p)}
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Poll</CardTitle>
                <CardDescription>Design a poll and share it with others</CardDescription>
              </CardHeader>
              <CardContent>
                <CreatePoll onCreatePoll={handleCreatePoll} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-polls" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Polls</CardTitle>
                <CardDescription>Manage polls you've created</CardDescription>
              </CardHeader>
              <CardContent>
                <PollList
                  polls={polls.filter((poll) => String(poll.creatorId) === String(user.id))}
                  onSelectPoll={(p) => setSelectedPoll(p)}
                  showActions={true}
                  onDeletePoll={async (pollId) => {
                    try {
                      await apiDeletePoll(pollId)
                      setPolls(prev => prev.filter(p => p.id !== pollId))
                    } catch (e: any) {
                      console.error(e)
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
