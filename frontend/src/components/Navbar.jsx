"use client"

import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  if (location.pathname === "/" || location.pathname.startsWith("/register-for-event")) {
    return null
  }

  return (
    <nav className="bg-black text-white border-b border-zinc-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            EventHub
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-300">Welcome, {user.name}</span>
                {user.role === "attendee" && (
                  <Link to="/attendee" className="hover:text-green-400 font-medium transition-colors">
                    My Hub
                  </Link>
                )}
                {user.role === "organizer" || user.role === "admin" ? (
                  <>
                    <Link to="/organizer" className="hover:text-green-400 font-medium transition-colors">
                      Organizer Hub
                    </Link>
                  </>
                ) : null}
                <button onClick={handleLogout} className="text-gray-400 hover:text-white font-medium transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform active:scale-95">
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
