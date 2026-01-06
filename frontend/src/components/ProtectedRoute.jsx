"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />
  }

  return children
}
