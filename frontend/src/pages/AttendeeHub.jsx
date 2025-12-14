"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { eventsAPI, registrationsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"

export default function AttendeeHub() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("invites")
  const [invites, setInvites] = useState([])
  const [exploreEvents, setExploreEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    eventType: "",
    area: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === "explore") {
      fetchExploreEvents()
    }
  }, [activeTab, searchQuery, filters])

  const fetchData = async () => {
    try {
      setLoading(true)

      const invitesResponse = await registrationsAPI.getUserInvitations(1, 20)
      setInvites(invitesResponse.data.invitations)

      // Fetch my registered events
      const myEventsResponse = await registrationsAPI.getUserRegistrations(1, 20)
      setMyEvents(myEventsResponse.data.registrations)
    } catch (err) {
      console.error("Failed to fetch attendee data", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchExploreEvents = async () => {
    try {
      const response = await eventsAPI.getEvents(1, 20, searchQuery, "", filters.eventType, filters.area, "")
      setExploreEvents(response.data.events)
    } catch (err) {
      console.error("Failed to fetch explore events", err)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      await registrationsAPI.registerEvent(eventId)
      alert("Successfully registered for the event!")
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed")
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Discover events and manage your invitations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("invites")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "invites"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Invites ({invites.length})
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "explore"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Explore Events
            </button>
            <button
              onClick={() => setActiveTab("myevents")}
              className={`px-6 py-4 font-medium transition ${
                activeTab === "myevents"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Events ({myEvents.length})
            </button>
          </div>
        </div>

        {/* Invites Tab */}
        {activeTab === "invites" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Invitations</h2>
            <p className="text-gray-600 mb-6">Events you've been invited to and registered for</p>
            {invites.length === 0 ? (
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500">No invitations at the moment</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invites.map((invitation) => {
                  const event = invitation.event
                  return (
                    <div key={invitation._id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                      {event.image && (
                        <img
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            INVITED
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {event.eventType}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                          <p>🕐 {event.time}</p>
                          <p>📍 {event.venue}</p>
                          <p>🏷️ {event.area}</p>
                        </div>
                        <Link
                          to={`/events/${event._id}`}
                          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Explore Tab */}
        {activeTab === "explore" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Upcoming Events</h2>
            <p className="text-gray-600 mb-6">Discover both open and invite-only events</p>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select
                    value={filters.eventType}
                    onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
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
                  <input
                    type="text"
                    placeholder="Filter by area..."
                    value={filters.area}
                    onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
            {exploreEvents.length === 0 ? (
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
                {exploreEvents.map((event) => (
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
                        <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                        <p>🕐 {event.time}</p>
                        <p>📍 {event.venue}</p>
                        <p>🏷️ {event.area}</p>
                        {event.price > 0 && <p>💰 ${event.price}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/events/${event._id}`}
                          className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded transition"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleRegister(event._id)}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 mb-4">You haven't registered for any events yet</p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.map((registration) => (
                  <div key={registration._id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
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
                          <p>📅 {new Date(registration.event.date).toLocaleDateString()}</p>
                          <p>🕐 {registration.event.time}</p>
                          <p>📍 {registration.event.venue}</p>
                          <p>🏷️ {registration.event.area}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/events/${registration.event._id}`}
                          className="text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition whitespace-nowrap"
                        >
                          View Event
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
