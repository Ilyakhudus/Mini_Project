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
  const [pagination, setPagination] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchEvents()
  }, [page, search])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventsAPI.getEvents(page, 9, search)
      setEvents(response.data.events)
      setPagination(response.data.pagination)
    } catch (err) {
      setError("Failed to load events")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Events</h1>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={handleSearch}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {user && (user.role === "organizer" || user.role === "admin") && (
              <Link
                to="/create-event"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Event
              </Link>
            )}
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
