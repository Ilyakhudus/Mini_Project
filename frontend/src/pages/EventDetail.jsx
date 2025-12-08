"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { eventsAPI, registrationsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await eventsAPI.getEventById(id)
      setEvent(response.data.event)
    } catch (err) {
      setError("Failed to load event")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!user) {
      navigate("/login")
      return
    }

    try {
      setRegistering(true)
      await registrationsAPI.registerEvent(id)
      alert("Successfully registered for the event!")
      fetchEvent()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to register")
    } finally {
      setRegistering(false)
    }
  }

  const handleEdit = () => {
    navigate(`/edit-event/${id}`)
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return

    try {
      await eventsAPI.deleteEvent(id)
      navigate("/")
    } catch (err) {
      alert("Failed to delete event")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center">Event not found</div>
  }

  const capacityPercentage = (event.registeredCount / event.capacity) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {event.image && (
          <img
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>

          {event.description && <p className="text-gray-600 mb-6">{event.description}</p>}

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {event.time}
                </p>
                <p>
                  <span className="font-medium">Venue:</span> {event.venue}
                </p>
                <p>
                  <span className="font-medium">Price:</span> ${event.price}
                </p>
                <p>
                  <span className="font-medium">Organizer:</span> {event.organizer.name}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">
                {event.registeredCount}/{event.capacity} Registered
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{Math.round(capacityPercentage)}% Capacity</p>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">{error}</div>}

          <div className="flex gap-4">
            {user && user.role === "admin" ? (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Event
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete Event
                </button>
              </>
            ) : user && user.role === "organizer" && user.id === event.organizer._id ? (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Event
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete Event
                </button>
              </>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering || event.registeredCount >= event.capacity}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering
                  ? "Registering..."
                  : event.registeredCount >= event.capacity
                    ? "Event Full"
                    : "Register Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
