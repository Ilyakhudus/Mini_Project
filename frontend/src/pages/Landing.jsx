"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { eventsAPI, authAPI } from "../utils/api"
import { formatDate } from "../utils/dateUtils"

export default function Landing() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("login")
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", role: "attendee" })
  const [error, setError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their hub
      if (user.role === "organizer" || user.role === "admin") {
        navigate("/organizer")
      } else if (user.role === "attendee") {
        navigate("/attendee")
      }
      // If no valid role, stay on landing page (or let them logout)
    }
  }, [user, loading, navigate])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      const response = await eventsAPI.getEvents(1, 6)
      setEvents(response.data.events || [])
    } catch (err) {
      console.error("[v0] Failed to fetch events:", err)
    } finally {
      setEventsLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await eventsAPI.getEvents(1, 20, searchQuery)
      setSearchResults(response.data.events || [])
    } catch (err) {
      console.error("[v0] Search failed:", err)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("[v0] Login submit started")
    setError("")
    setFormLoading(true)

    try {
      const response = await authAPI.login(loginData)
      console.log("[v0] Login successful:", response.data.user)
      login(response.data.user, response.data.token)

      if (response.data.user.role === "organizer" || response.data.user.role === "admin") {
        navigate("/organizer")
      } else {
        navigate("/attendee")
      }
    } catch (err) {
      console.log("[v0] Login error:", err.response?.data)
      setError(err.response?.data?.error || "Login failed. Please check your credentials.")
      setFormLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("[v0] Register submit started")
    setError("")
    setFormLoading(true)

    try {
      const response = await authAPI.register(registerData)
      console.log("[v0] Register successful:", response.data.user)
      login(response.data.user, response.data.token)

      if (response.data.user.role === "organizer" || response.data.user.role === "admin") {
        navigate("/organizer")
      } else {
        navigate("/attendee")
      }
    } catch (err) {
      console.log("[v0] Register error:", err.response?.data)
      setError(err.response?.data?.error || "Registration failed. Please try again.")
      setFormLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const password = registerData.password
    if (password.length === 0) return null
    if (password.length < 6) return { strength: "weak", color: "text-red-600", message: "Min 6 characters" }
    if (password.length < 8) return { strength: "fair", color: "text-amber-600", message: "Fair (8+ recommended)" }
    return { strength: "strong", color: "text-emerald-600", message: "Strong" }
  }

  const passwordStrength = getPasswordStrength()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (user) {
    return null
  }

  const displayEvents = isSearching ? searchResults : events

  const handleEventClick = (e, eventId) => {
    e.preventDefault()
    console.log("[v0] Navigating to event:", eventId)
    navigate(`/events/${eventId}`)
  }

  return (
    <div className="min-h-screen bg-black animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Auth Forms */}
          <div className="order-2 lg:order-1 animate-slide-up">
            <div className="bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 p-8 sticky top-8 hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">EventHub</h1>
                <p className="text-gray-400">Create and join amazing events</p>
              </div>

              {/* Tab Buttons */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login")
                    setError("")
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${activeTab === "login"
                    ? "bg-emerald-600 text-white shadow-md transform scale-105"
                    : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register")
                    setError("")
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${activeTab === "register"
                    ? "bg-emerald-600 text-white shadow-md transform scale-105"
                    : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border-2 border-red-300 p-4 text-sm text-red-700 mb-4 animate-scale-in">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all bg-black"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all bg-black"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:transform-none"
                  >
                    {formLoading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {activeTab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="register-name" className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="register-name"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all bg-black"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all bg-black"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      id="register-password"
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all bg-black"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                    {passwordStrength && (
                      <p className={`mt-1 text-xs ${passwordStrength.color}`}>{passwordStrength.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="register-role" className="block text-sm font-medium text-gray-300 mb-1">
                      I am a
                    </label>
                    <select
                      id="register-role"
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white bg-black transition-all outline-none"
                      value={registerData.role}
                      onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                    >
                      <option value="attendee">Attendee</option>
                      <option value="organizer">Event Organizer</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={formLoading || (passwordStrength && passwordStrength.strength === "weak")}
                    className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:transform-none"
                  >
                    {formLoading ? "Creating account..." : "Create Account"}
                  </button>
                </form>
              )}

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-green-100 grid grid-cols-3 gap-4 text-center">
                <div className="transform hover:scale-110 transition-transform duration-300 group">
                  <div className="text-2xl font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">100+</div>
                  <p className="text-xs text-gray-400">Events</p>
                </div>
                <div className="transform hover:scale-110 transition-transform duration-300 delay-100 group">
                  <div className="text-2xl font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">50K+</div>
                  <p className="text-xs text-gray-400">Users</p>
                </div>
                <div className="transform hover:scale-110 transition-transform duration-300 delay-200 group">
                  <div className="text-2xl font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">99%</div>
                  <p className="text-xs text-gray-400">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Explore Events */}
          <div className="lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto order-1 lg:order-2 animate-slide-in-right">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Explore Events</h2>
              <p className="text-gray-400">Discover amazing events happening near you</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search events by name or code..."
                  className="flex-1 px-4 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all shadow-sm focus:shadow-emerald-900 bg-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95 transform duration-150"
                >
                  Search
                </button>
                {isSearching && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-3 py-2 bg-zinc-800 text-gray-300 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {isSearching && (
              <p className="text-sm text-emerald-700 mb-4 animate-fade-in">
                Found {searchResults.length} event{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            )}

            {/* Events Grid - More compact */}
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 rounded-xl shadow border border-zinc-800 animate-scale-in">
                <p className="text-gray-400">
                  {isSearching ? "No events found matching your search." : "No events available at the moment."}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {displayEvents.map((event, index) => (
                  <div
                    key={event._id}
                    onClick={(e) => handleEventClick(e, event._id)}
                    className="bg-zinc-900 rounded-xl shadow-md border border-zinc-800 hover:shadow-xl hover:border-zinc-700 transition-all duration-300 overflow-hidden group cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {event.image && (
                      <div className="overflow-hidden">
                        <img
                          src={event.image.startsWith("http") ? event.image : `http://localhost:5000${event.image}`}
                          alt={event.title}
                          className="w-full h-28 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 text-xs font-mono rounded border border-emerald-900/50">
                          {event.eventCode || "N/A"}
                        </span>
                        {event.accessType === "invite-only" && (
                          <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-500 text-xs rounded border border-yellow-900/50">Invite Only</span>
                        )}
                      </div>
                      <h3 className="font-bold text-white mb-1 line-clamp-1 text-sm group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                      <div className="space-y-0.5 text-xs text-gray-400">
                        <p className="flex items-center gap-1">📅 {formatDate(event.date)}</p>
                        <p className="flex items-center gap-1">📍 {event.venue}</p>
                        <p className="font-bold text-emerald-500">₹{event.price || 0}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-green-100">
                        <div className="flex justify-between text-xs text-emerald-500 mb-1">
                          <span>Capacity</span>
                          <span>
                            {event.registeredCount || 0}/{event.capacity || 100}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1">
                          <div
                            className="bg-emerald-500 h-1 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.min(((event.registeredCount || 0) / (event.capacity || 100)) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
