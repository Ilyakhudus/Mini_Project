"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { eventsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import EventCard from "../components/EventCard"
import Pagination from "../components/Pagination"

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [eventCode, setEventCode] = useState("")
  const [eventType, setEventType] = useState("")
  const [accessType, setAccessType] = useState("")
  const [pagination, setPagination] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchEvents()
  }, [page, search, eventCode, eventType, accessType])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[v0] Page became visible, refetching events")
        fetchEvents()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [page, search, eventCode, eventType, accessType])

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[v0] Refreshing events (30s interval)")
      fetchEvents()
    }, 30000)

    return () => clearInterval(interval)
  }, [page, search, eventCode, eventType, accessType])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("[v0] Fetching events with params:", { page, search, eventCode, eventType, accessType })
      const response = await eventsAPI.getEvents(page, 9, search, "", eventType, "", accessType, eventCode)
      console.log("[v0] Events response:", response.data)
      setEvents(response.data.events || [])
      setPagination(response.data.pagination)
    } catch (err) {
      console.error("[v0] Failed to load events:", err)
      setError(err.response?.data?.error || "Failed to load events. Please try again.")
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleEventCodeSearch = (e) => {
    setEventCode(e.target.value.toUpperCase())
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Events</h1>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search events by name..."
                value={search}
                onChange={handleSearch}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Enter Event Code"
                value={eventCode}
                onChange={handleEventCodeSearch}
                maxLength={6}
                className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
              {user && (user.role === "organizer" || user.role === "admin") && (
                <Link
                  to="/create-event"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
                >
                  Create Event
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Event Types</option>
                <option value="seminar">Seminar</option>
                <option value="concert">Concert</option>
                <option value="meet-up">Meet-up</option>
                <option value="workshop">Workshop</option>
                <option value="conference">Conference</option>
                <option value="webinar">Webinar</option>
                <option value="other">Other</option>
              </select>

              <select
                value={accessType}
                onChange={(e) => {
                  setAccessType(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Access Types</option>
                <option value="open">Open Events</option>
                <option value="invite-only">Invite Only</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No events found</p>
            {eventCode && <p className="text-gray-400 mt-2">Try checking the event code or searching by name</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <Pagination pagination={pagination} currentPage={page} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
