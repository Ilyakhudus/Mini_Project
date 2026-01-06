"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function Login() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to their hub
        if (user.role === "organizer" || user.role === "admin") {
          navigate("/organizer", { replace: true })
        } else if (user.role === "attendee") {
          navigate("/attendee", { replace: true })
        } else {
          // Invalid role, maybe logout? For now just go to / so they can sign out
          navigate("/", { replace: true })
        }
      } else {
        // Redirect to landing page for login
        navigate("/", { replace: true })
      }
    }
  }, [user, loading, navigate])

  // Show nothing while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
    </div>
  )
}
