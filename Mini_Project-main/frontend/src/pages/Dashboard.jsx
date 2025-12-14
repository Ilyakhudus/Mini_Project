"use client"

import { useState, useEffect } from "react"
import { registrationsAPI, eventsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const statsResponse = await registrationsAPI.getDashboardStats()
      setStats(statsResponse.data.stats)

      if (user.role === "organizer") {
        const eventsResponse = await eventsAPI.getOrganizerEvents()
        setEvents(eventsResponse.data.events)
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm mb-2">Total Events</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm mb-2">Total Registrations</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalRegistrations}</p>
            </div>
            {user.role === "organizer" && (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">My Events</p>
                <p className="text-3xl font-bold text-purple-600">{stats.organizerEvents}</p>
              </div>
            )}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm mb-2">My Registrations</p>
              <p className="text-3xl font-bold text-orange-600">{stats.userRegistrations}</p>
            </div>
          </div>
        )}

        {user.role === "organizer" && events.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Events</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Title</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Registrations</th>
                    <th className="text-left py-3 px-4">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{event.title}</td>
                      <td className="py-3 px-4">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{event.registeredCount}</td>
                      <td className="py-3 px-4">{event.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
