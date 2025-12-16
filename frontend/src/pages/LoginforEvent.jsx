"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { authAPI, eventsAPI, registrationsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { formatDate } from "../utils/dateUtils"

export default function LoginForEvent() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, login } = useAuth()
  const [activeTab, setActiveTab] = useState("login")
  const [event, setEvent] = useState(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [error, setError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [registering, setRegistering] = useState(false)
  const registrationAttempted = useRef(false)

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", role: "attendee" })

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    if (!authLoading && user && event && !registrationAttempted.current && !showPinModal) {
      registrationAttempted.current = true
      handleEventRegistration()
    }
  }, [user, authLoading, event, showPinModal])

  const fetchEvent = async () => {
    try {
      setEventLoading(true)
      const response = await eventsAPI.getEventById(eventId)
      setEvent(response.data.event)
    } catch (err) {
      setError("Failed to load event details")
      console.error("[v0] fetchEvent error:", err)
    } finally {
      setEventLoading(false)
    }
  }

  const handleEventRegistration = async () => {
    if (!event) return

    console.log("[v0] handleEventRegistration called, accessType:", event.accessType)

    if (event.accessType === "invite-only") {
      setShowPinModal(true)
      return
    }

    await submitRegistration()
  }

  const submitRegistration = async (pinValue = null) => {
    try {
      setRegistering(true)
      setPinError("")
      setError("")

      console.log("[v0] submitRegistration called with PIN:", pinValue ? "***" : null)

      const response = await registrationsAPI.registerEvent(eventId, pinValue)

      console.log("[v0] Registration response:", response.data)

      alert("Successfully registered for the event!")
      setShowPinModal(false)
      setPin("")

      if (user?.role === "organizer" || user?.role === "admin") {
        navigate("/organizer", { replace: true })
      } else {
        navigate("/attendee", { replace: true })
      }
    } catch (err) {
      console.error("[v0] Registration error:", err.response?.data)
      const errorMsg = err.response?.data?.error || "Failed to register for event"

      if (showPinModal) {
        setPinError(errorMsg)
      } else {
        setError(errorMsg)
        // If already registered, redirect to hub after a short delay
        if (errorMsg.includes("Already registered")) {
          setTimeout(() => {
            if (user?.role === "organizer" || user?.role === "admin") {
              navigate("/organizer", { replace: true })
            } else {
              navigate("/attendee", { replace: true })
            }
          }, 2000)
        }
      }
    } finally {
      setRegistering(false)
    }
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!pin.trim()) {
      setPinError("Please enter the PIN")
      return
    }
    submitRegistration(pin)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("[v0] LoginForEvent: Login submit started")
    setError("")
    setFormLoading(true)
    registrationAttempted.current = false

    try {
      const response = await authAPI.login(loginData)
      console.log("[v0] LoginForEvent: Login successful")
      login(response.data.user, response.data.token)
      // After login, the useEffect will trigger registration
    } catch (err) {
      console.log("[v0] LoginForEvent: Login error:", err.response?.data)
      setError(err.response?.data?.error || "Login failed. Please check your credentials.")
      setFormLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("[v0] LoginForEvent: Register submit started")
    setError("")
    setFormLoading(true)
    registrationAttempted.current = false

    try {
      const response = await authAPI.register(registerData)
      console.log("[v0] LoginForEvent: Register successful")
      login(response.data.user, response.data.token)
      // After registration, the useEffect will trigger event registration
    } catch (err) {
      console.log("[v0] LoginForEvent: Register error:", err.response?.data)
      setError(err.response?.data?.error || "Registration failed. Please try again.")
      setFormLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const password = registerData.password
    if (password.length === 0) return null
    if (password.length < 6) return { strength: "weak", color: "text-red-600", message: "Min 6 characters" }
    if (password.length < 8) return { strength: "fair", color: "text-yellow-600", message: "Fair (8+ recommended)" }
    return { strength: "strong", color: "text-green-600", message: "Strong" }
  }

  const passwordStrength = getPasswordStrength()

  if (authLoading || eventLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Event not found</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    )
  }

  // If user is logged in and we're showing the PIN modal
  if (user && showPinModal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Attendee PIN</h2>
          <p className="text-gray-600 mb-4">
            This is an invite-only event. Please enter the attendee PIN provided by the organizer.
          </p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-900"
            />
            {pinError && (
              <div className="rounded-md bg-red-50 border-2 border-red-300 p-3 text-sm text-red-700 mb-4">
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
                  <span className="font-semibold">{pinError}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/events/${eventId}`)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registering}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {registering ? "Registering..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // If user is logged in and registering (for open events)
  if (user && registering) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Registering you for the event...</p>
        </div>
      </div>
    )
  }

  if (user && error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800 mb-4">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">Redirecting you to your events...</p>
          <Link
            to={user?.role === "organizer" || user?.role === "admin" ? "/organizer" : "/attendee"}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Go to My Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Event Preview Card */}
        <div className="bg-blue-600 text-white rounded-t-xl p-6">
          <p className="text-blue-200 text-sm mb-1">Register for Event</p>
          <h2 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>📅 {formatDate(event.date)}</span>
            <span>📍 {event.venue}</span>
          </div>
          {event.accessType === "invite-only" && (
            <span className="inline-block mt-2 px-2 py-1 bg-amber-400 text-amber-900 text-xs rounded">
              Invite Only - PIN Required
            </span>
          )}
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          <p className="text-gray-600 text-center mb-4">Sign in or create an account to register for this event</p>

          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login")
                setError("")
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                activeTab === "login" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                activeTab === "register" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border-2 border-red-300 p-4 text-sm text-red-700 mb-4">
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
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {formLoading ? "Signing in..." : "Sign In & Register"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="register-name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="John Doe"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
                {passwordStrength && (
                  <p className={`mt-1 text-xs ${passwordStrength.color}`}>{passwordStrength.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={formLoading || (passwordStrength && passwordStrength.strength === "weak")}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {formLoading ? "Creating account..." : "Sign Up & Register"}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Link to={`/events/${eventId}`} className="text-sm text-gray-600 hover:text-blue-600">
              ← Back to event details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
