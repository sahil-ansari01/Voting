"use client"

import { useEffect, useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)

  // Restore session from localStorage on first load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser")
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as { id: string; name: string; email: string }
        setUser(parsed)
      }
    } catch {}
  }, [])

  const handleLogin = (userData: { id: string; name: string; email: string }) => {
    setUser(userData)
    try {
      // Persist user and token (token set by AuthForm)
      localStorage.setItem("authUser", JSON.stringify(userData))
    } catch {}
  }

  const handleLogout = () => {
    setUser(null)
    try {
      localStorage.removeItem("authUser")
      localStorage.removeItem("authToken")
    } catch {}
  }

  return (
    <main className="min-h-screen bg-background">
      {!user ? <AuthForm onLogin={handleLogin} /> : <Dashboard user={user} onLogout={handleLogout} />}
    </main>
  )
}
