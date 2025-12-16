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
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")

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
      navigate(`/register-for-event/${id}`)
      return
    }

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
      await registrationsAPI.registerEvent(id, pinValue)
      alert("Successfully registered for the event!")
      setShowPinModal(false)
      setPin("")
      fetchEvent()
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to register"
      if (showPinModal) {
        setPinError(errorMsg)
      } else {
        alert(errorMsg)
      }
    } finally {
      setRegistering(false)
    }
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (!pin.trim()) {
      setPinError("Please enter the PIN")
      return
    }
    submitRegistration(pin)
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
  const isOrganizer = user && event.organizer && user.id === event.organizer._id
  const isCollaborator = user && event.collaborators?.some((c) => c.userId?._id === user.id)

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
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded-full">
              Code: {event.eventCode}
            </span>
            <span
              className={`px-3 py-1 text-sm rounded-full ${
                event.accessType === "invite-only" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
              }`}
            >
              {event.accessType === "invite-only" ? "Invite Only" : "Open Event"}
            </span>
            {event.eventType && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full capitalize">
                {event.eventType}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>

          {event.description && <p className="text-gray-600 mb-6">{event.description}</p>}

          {event.detailedDescription && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About This Event</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{event.detailedDescription}</p>
            </div>
          )}

          {event.activitiesAndBenefits && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Activities & Benefits</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{event.activitiesAndBenefits}</p>
            </div>
          )}

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
                {event.area && (
                  <p>
                    <span className="font-medium">Area:</span> {event.area}
                  </p>
                )}
                <p>
                  <span className="font-medium">Price:</span> ₹{event.price}
                </p>
                <p>
                  <span className="font-medium">Organizer:</span> {event.organizer?.name}
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

              {(isOrganizer || isCollaborator) && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Event PINs (Visible to organizers only)</p>
                  <p className="text-sm">
                    <span className="font-medium">Organizer PIN:</span>{" "}
                    <span className="font-mono">{event.organizerPIN}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Attendee PIN:</span>{" "}
                    <span className="font-mono">{event.attendeePIN}</span>
                  </p>
                </div>
              )}
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
            ) : isOrganizer ? (
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
                    : event.accessType === "invite-only"
                      ? "Register with PIN"
                      : "Register Now"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              {pinError && <p className="text-red-600 text-sm mb-4">{pinError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false)
                    setPin("")
                    setPinError("")
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {registering ? "Verifying..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
