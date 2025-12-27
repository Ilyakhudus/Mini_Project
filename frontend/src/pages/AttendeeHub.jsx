"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { eventsAPI, registrationsAPI, messagesAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { formatDate } from "../utils/dateUtils"

export default function AttendeeHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("explore")
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("")
  const [accessTypeFilter, setAccessTypeFilter] = useState("")

  const [inviteCode, setInviteCode] = useState("")
  const [invitePin, setInvitePin] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)

  // Updates tab states
  const [systemUpdates, setSystemUpdates] = useState([])
  const [updatesViewed, setUpdatesViewed] = useState(false)
  const [organizerMessages, setOrganizerMessages] = useState([])
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // PIN Modal for invite-only registration
  const [pinModalEvent, setPinModalEvent] = useState(null)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinLoading, setPinLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching initial data for AttendeeHub")

      // Fetch my registered events and organizer messages in parallel
      const [myEventsResponse, messagesResponse] = await Promise.all([
        registrationsAPI.getUserRegistrations(1, 20),
        messagesAPI.getUserMessages(),
      ])

      console.log("[v0] My registrations response:", myEventsResponse.data)
      console.log("[v0] Messages response:", messagesResponse.data)

      setMyEvents(myEventsResponse.data.registrations || [])
      generateSystemUpdates(myEventsResponse.data.registrations || [])

      const messages = messagesResponse.data.messages || []
      setOrganizerMessages(messages)
      setUnreadMessageCount(messages.filter((m) => !m.read).length)
    } catch (err) {
      console.error("[v0] Error fetching initial data:", err)
      setError(err.response?.data?.error || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const generateSystemUpdates = (registrations) => {
    const now = new Date()
    const generatedUpdates = []

    registrations.forEach((reg) => {
      if (!reg.event) return

      const eventDate = new Date(reg.event.date)
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24))

      if (daysUntil <= 7 && daysUntil > 0) {
        generatedUpdates.push({
          id: `upcoming-${reg._id}`,
          type: "upcoming",
          title: `${reg.event.title} is coming up!`,
          message: `Only ${daysUntil} day${daysUntil > 1 ? "s" : ""} left until the event.`,
          event: reg.event,
          date: now,
        })
      }

      if (daysUntil === 0) {
        generatedUpdates.push({
          id: `today-${reg._id}`,
          type: "today",
          title: `${reg.event.title} is TODAY!`,
          message: `Don't forget - your event starts at ${reg.event.time}.`,
          event: reg.event,
          date: now,
        })
      }
    })

    setSystemUpdates(generatedUpdates)
  }

  const handleMarkMessageRead = async (messageId) => {
    try {
      await messagesAPI.markAsRead(messageId)
      setOrganizerMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, read: true, readAt: new Date() } : msg))
      )
      setUnreadMessageCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark message as read", err)
    }
  }

  // Handle voting on a poll
  const handleVotePoll = async (messageId, optionIndex) => {
    try {
      const response = await messagesAPI.votePoll(messageId, optionIndex)
      // Update the message in state with new poll results
      setOrganizerMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            return {
              ...msg,
              pollOptions: response.data.pollResults,
              userVotes: response.data.userVotes,
            }
          }
          return msg
        })
      )
    } catch (err) {
      console.error("Failed to vote on poll", err)
      alert(err.response?.data?.error || "Failed to submit vote")
    }
  }

  const fetchExploreEvents = async () => {
    try {
      const response = await eventsAPI.getEvents(
        1,
        20,
        searchTerm,
        categoryFilter,
        eventTypeFilter,
        accessTypeFilter,
        ""
      )
      setEvents(response.data.events)
    } catch (err) {
      console.error("Failed to fetch explore events", err)
    }
  }

  // FIXED: Register button now properly handles invite-only events by showing PIN modal
  const handleRegister = async (event) => {
    if (event.accessType === "invite-only") {
      // Show PIN modal for invite-only events
      setPinModalEvent(event)
      setPinInput("")
      setPinError("")
      setShowPinModal(true)
      return
    }

    // For open events, register directly
    try {
      await registrationsAPI.registerEvent(event._id)
      alert("Successfully registered for the event!")
      fetchInitialData()
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed")
    }
  }

  // Handle PIN submission for invite-only event registration
  const handlePinSubmit = async (e) => {
    e.preventDefault()
    setPinError("")

    if (!pinInput.trim()) {
      setPinError("Please enter the attendee PIN")
      return
    }

    try {
      setPinLoading(true)
      await registrationsAPI.registerEvent(pinModalEvent._id, pinInput.trim())
      alert("Successfully registered for the event!")
      setShowPinModal(false)
      setPinModalEvent(null)
      setPinInput("")
      fetchInitialData()
    } catch (err) {
      setPinError(err.response?.data?.error || "Registration failed. Please check your PIN.")
    } finally {
      setPinLoading(false)
    }
  }

  const handleInviteCodeRegister = async (e) => {
    e.preventDefault()
    setInviteError("")

    if (!inviteCode.trim()) {
      setInviteError("Please enter an event code")
      return
    }
    if (!invitePin.trim()) {
      setInviteError("Please enter the attendee PIN")
      return
    }

    try {
      setInviteLoading(true)
      const eventsResponse = await eventsAPI.getEvents(1, 1, "", "", "", "", "", inviteCode.trim().toUpperCase())

      if (!eventsResponse.data.events || eventsResponse.data.events.length === 0) {
        setInviteError("Event not found with this code")
        return
      }

      const event = eventsResponse.data.events[0]
      await registrationsAPI.registerEvent(event._id, invitePin.trim())
      alert("Successfully registered for the event!")
      setInviteCode("")
      setInvitePin("")
      fetchInitialData()
      setActiveTab("myevents")
    } catch (err) {
      setInviteError(err.response?.data?.error || "Registration failed. Please check your code and PIN.")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleShowEventDetails = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === "updates") {
      setUpdatesViewed(true)
    }
  }

  const getTotalUnreadCount = () => {
    const systemCount = !updatesViewed ? systemUpdates.length : 0
    return systemCount + unreadMessageCount
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your hub...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mt-4 text-red-600">{error}</p>
          <button
            onClick={() => fetchInitialData()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Discover events and manage your registrations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange("explore")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "explore"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Explore Events
            </button>
            <button
              onClick={() => handleTabChange("myevents")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "myevents"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Registrations ({myEvents.length})
            </button>
            <button
              onClick={() => handleTabChange("updates")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "updates"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Updates{" "}
              {getTotalUnreadCount() > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {getTotalUnreadCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Explore Tab */}
        {activeTab === "explore" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Upcoming Events</h2>
            <p className="text-gray-600 mb-6">Discover both open and invite-only events</p>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Have an Invite Code?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Enter your event code and PIN to register for invite-only events directly.
              </p>
              <form onSubmit={handleInviteCodeRegister} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Event Code (e.g., ABC123)"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    maxLength={10}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Attendee PIN (4 digits)"
                    value={invitePin}
                    onChange={(e) => setInvitePin(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={4}
                  />
                </div>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {inviteLoading ? "Registering..." : "Register with Code"}
                </button>
              </form>
              {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="networking">Networking</option>
                    <option value="social">Social</option>
                    <option value="training">Training</option>
                    <option value="webinar">Webinar</option>
                  </select>
                </div>
                <div>
                  <select
                    value={accessTypeFilter}
                    onChange={(e) => setAccessTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Access Types</option>
                    <option value="open">Open</option>
                    <option value="invite-only">Invite Only</option>
                  </select>
                </div>
              </div>
              <button
                onClick={fetchExploreEvents}
                className="mt-4 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                Search
              </button>
            </div>

            {/* Events Grid */}
            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-gray-500">No events found matching your criteria</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event._id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                    {event.image && (
                      <img
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            event.accessType === "invite-only"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {event.accessType === "invite-only" ? "INVITE-ONLY" : "OPEN"}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {event.eventType}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>Date: {formatDate(event.date)}</p>
                        <p>Time: {event.time}</p>
                        <p>Venue: {event.venue}</p>
                        <p>Area: {event.area}</p>
                        {event.price > 0 && <p>Price: Rs.{event.price}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/events/${event._id}`}
                          className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded transition"
                        >
                          Details
                        </Link>
                        {/* FIXED: Register button now works for invite-only events */}
                        <button
                          onClick={() => handleRegister(event)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === "myevents" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Registered Events</h2>
            <p className="text-gray-500 text-sm mb-4">
              Found {myEvents.length} registration(s). Click on an event to see details.
            </p>
            {myEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 mb-4">You haven't registered for any events yet</p>
                <button
                  onClick={() => handleTabChange("explore")}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.map((registration) => {
                  if (!registration.event) {
                    return null
                  }
                  return (
                    <div
                      key={registration._id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
                      onClick={() => handleShowEventDetails(registration.event)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {registration.event.image && (
                          <img
                            src={registration.event.image || "/placeholder.svg"}
                            alt={registration.event.title}
                            className="w-full md:w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              REGISTERED
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              {registration.event.eventType}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{registration.event.title}</h3>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <p>Date: {formatDate(registration.event.date)}</p>
                            <p>Time: {registration.event.time}</p>
                            <p>Venue: {registration.event.venue}</p>
                            <p>Area: {registration.event.area}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-center text-sm text-blue-600 font-medium">Click for details</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Updates Tab - Now includes poll support */}
        {activeTab === "updates" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates</h2>
            <p className="text-gray-600 mb-6">Stay informed about your upcoming events and messages from organizers</p>

            {systemUpdates.length === 0 && organizerMessages.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-gray-500 mb-4">No updates at the moment</p>
                <p className="text-gray-400 text-sm">Updates about your registered events will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Organizer Messages Section - Now with Poll Support */}
                {organizerMessages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages from Organizers</h3>
                    <div className="space-y-4">
                      {organizerMessages.map((message) => (
                        <div
                          key={message._id}
                          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                            message.messageType === "poll" ? "border-amber-500" : "border-purple-500"
                          } ${!message.read ? "ring-2 ring-purple-200" : ""}`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-full ${
                                message.messageType === "poll"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-purple-100 text-purple-600"
                              }`}
                            >
                              {message.messageType === "poll" ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                  />
                                </svg>
                              ) : message.messageType === "media" ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{message.title}</h4>
                                {message.messageType === "poll" && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                    Poll
                                  </span>
                                )}
                                {!message.read && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-purple-600 mb-2">
                                From: {message.event?.title || "Event"} - {message.sender?.name || "Organizer"}
                              </p>
                              <p className="text-gray-600 mb-3">{message.content}</p>

                              {/* Media Content */}
                              {message.messageType === "media" && message.mediaUrl && (
                                <div className="mb-4">
                                  {message.mediaType === "image" && (
                                    <img
                                      src={message.mediaUrl}
                                      alt="Media attachment"
                                      className="max-w-full h-auto rounded-lg"
                                    />
                                  )}
                                  {message.mediaType === "audio" && (
                                    <audio controls className="w-full">
                                      <source src={message.mediaUrl} />
                                      Your browser does not support the audio element.
                                    </audio>
                                  )}
                                  {message.mediaType === "video" && (
                                    <video controls className="w-full rounded-lg">
                                      <source src={message.mediaUrl} />
                                      Your browser does not support the video element.
                                    </video>
                                  )}
                                </div>
                              )}

                              {/* Poll Options */}
                              {message.messageType === "poll" && message.pollOptions && (
                                <div className="space-y-2 mt-4">
                                  <p className="text-sm text-gray-500 mb-2">
                                    {message.pollMultiSelect
                                      ? "Select all that apply:"
                                      : "Select one option:"}
                                  </p>
                                  {message.pollOptions.map((option, index) => {
                                    const totalVotes = message.pollOptions.reduce(
                                      (sum, opt) => sum + opt.voteCount,
                                      0
                                    )
                                    const percentage =
                                      totalVotes > 0
                                        ? Math.round((option.voteCount / totalVotes) * 100)
                                        : 0
                                    const isSelected = message.userVotes?.includes(index)

                                    return (
                                      <button
                                        key={index}
                                        onClick={() => handleVotePoll(message._id, index)}
                                        className={`w-full text-left p-3 rounded-lg border transition relative overflow-hidden ${
                                          isSelected
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-blue-300"
                                        }`}
                                      >
                                        {/* Progress bar background */}
                                        <div
                                          className="absolute inset-0 bg-blue-100 transition-all"
                                          style={{ width: `${percentage}%`, opacity: 0.3 }}
                                        />
                                        <div className="relative flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                isSelected
                                                  ? "border-blue-500 bg-blue-500"
                                                  : "border-gray-300"
                                              }`}
                                            >
                                              {isSelected && (
                                                <svg
                                                  className="w-3 h-3 text-white"
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                              )}
                                            </div>
                                            <span className="font-medium">{option.text}</span>
                                          </div>
                                          <span className="text-sm text-gray-500">
                                            {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""} (
                                            {percentage}%)
                                          </span>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                                <span>{formatDate(message.createdAt)}</span>
                                <div className="flex items-center gap-3">
                                  {message.event && (
                                    <button
                                      onClick={() => handleShowEventDetails(message.event)}
                                      className="text-blue-600 hover:underline"
                                    >
                                      View Event
                                    </button>
                                  )}
                                  {!message.read && (
                                    <button
                                      onClick={() => handleMarkMessageRead(message._id)}
                                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                                    >
                                      Mark as Read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Updates Section */}
                {systemUpdates.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Reminders</h3>
                    <div className="space-y-4">
                      {systemUpdates.map((update) => (
                        <div
                          key={update.id}
                          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                            update.type === "today"
                              ? "border-red-500"
                              : update.type === "upcoming"
                              ? "border-yellow-500"
                              : "border-blue-500"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-full ${
                                update.type === "today"
                                  ? "bg-red-100 text-red-600"
                                  : update.type === "upcoming"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {update.type === "today" ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{update.title}</h3>
                              <p className="text-gray-600 text-sm mt-1">{update.message}</p>
                              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                <span>Venue: {update.event.venue}</span>
                                <span>Time: {update.event.time}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleShowEventDetails(update.event)}
                              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedEvent.image && (
              <img
                src={selectedEvent.image || "/placeholder.svg"}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded-full">
                  Code: {selectedEvent.eventCode}
                </span>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedEvent.accessType === "invite-only"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {selectedEvent.accessType === "invite-only" ? "Invite Only" : "Open Event"}
                </span>
                {selectedEvent.eventType && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full capitalize">
                    {selectedEvent.eventType}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>

              {selectedEvent.description && <p className="text-gray-600 mb-4">{selectedEvent.description}</p>}

              {selectedEvent.detailedDescription && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Event</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.detailedDescription}</p>
                </div>
              )}

              {selectedEvent.activitiesAndBenefits && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Activities & Benefits</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.activitiesAndBenefits}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-medium">Date:</span> {formatDate(selectedEvent.date)}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {selectedEvent.time}
                    </p>
                    <p>
                      <span className="font-medium">Venue:</span> {selectedEvent.venue}
                    </p>
                    {selectedEvent.area && (
                      <p>
                        <span className="font-medium">Area:</span> {selectedEvent.area}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Price:</span> Rs.{selectedEvent.price}
                    </p>
                    <p>
                      <span className="font-medium">Organizer:</span> {selectedEvent.organizer?.name}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                  <p className="text-xl font-bold text-blue-600 mb-2">
                    {selectedEvent.registeredCount}/{selectedEvent.capacity} Registered
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((selectedEvent.registeredCount / selectedEvent.capacity) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {Math.round((selectedEvent.registeredCount / selectedEvent.capacity) * 100)}% Capacity
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
                <Link
                  to={`/events/${selectedEvent._id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
                >
                  View Full Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal for Invite-Only Registration */}
      {showPinModal && pinModalEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enter Attendee PIN</h3>
            <p className="text-gray-600 mb-4">
              This is an invite-only event. Please enter the attendee PIN to register for{" "}
              <span className="font-semibold">{pinModalEvent.title}</span>.
            </p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="text"
                placeholder="Enter 4-digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                maxLength={4}
                autoFocus
              />
              {pinError && <p className="text-red-600 text-sm mt-2">{pinError}</p>}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false)
                    setPinModalEvent(null)
                    setPinInput("")
                    setPinError("")
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {pinLoading ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
