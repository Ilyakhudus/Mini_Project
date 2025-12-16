"use client"

import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">
            EventHub
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-sm">Welcome, {user.name}</span>
                {user.role === "attendee" && (
                  <Link to="/attendee" className="hover:text-blue-200">
                    My Hub
                  </Link>
                )}
                {user.role === "organizer" || user.role === "admin" ? (
                  <>
                    <Link to="/organizer" className="hover:text-blue-200">
                      Organizer Hub
                    </Link>
                    <Link to="/dashboard" className="hover:text-blue-200">
                      Stats
                    </Link>
                  </>
                ) : null}
                <Link to="/my-registrations" className="hover:text-blue-200">
                  My Registrations
                </Link>
                <button onClick={handleLogout} className="hover:text-blue-200">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
