"use client"

import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuth } from "../hooks/useAuth"

export default function Landing() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect to events
      navigate("/events")
    }
  }, [user, loading, navigate])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // If user is authenticated, don't show landing page
  if (user) {
    return null
  }

  // Show landing page with tabs for login and register
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Manager</h1>
            <p className="text-gray-600">Create and join amazing events</p>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Sign Up
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">100+</div>
              <p className="text-sm text-gray-600">Events</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">50K+</div>
              <p className="text-sm text-gray-600">Users</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">99%</div>
              <p className="text-sm text-gray-600">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
