"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function Register() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to their hub
        if (user.role === "organizer" || user.role === "admin") {
          navigate("/organizer", { replace: true })
        } else {
          navigate("/attendee", { replace: true })
        }
      } else {
        // Redirect to landing page for registration
        navigate("/", { replace: true })
      }
    }
  }, [user, loading, navigate])

  // Show nothing while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
