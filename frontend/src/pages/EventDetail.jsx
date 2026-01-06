"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { eventsAPI, registrationsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { formatDate } from "../utils/dateUtils"

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
      const eventData = response.data?.event || response.event

      if (!eventData) {
        setError("Event not found or invalid response from server")
        return
      }

      setEvent(eventData)
      setError("")
    } catch (err) {
      console.error("Error fetching event:", err)
      setError(err.response?.data?.message || "Failed to load event. Please try again.")
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
      await fetchEvent()
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4">
        <div className="max-w-md w-full bg-red-900/20 border border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Error Loading Event</h2>
          <p className="text-red-400 mb-4">{error || "Event not found"}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700/80 transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  const capacityPercentage = event.capacity ? ((event.registeredCount || 0) / event.capacity) * 100 : 0
  const isOrganizer = user && event.organizer && user.id === event.organizer._id
  const isCollaborator = user && event.collaborators?.some((c) => c.userId?._id === user.id)

  const imageUrl = event.image ? `http://localhost:5000${event.image}` : null

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg border border-zinc-800">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
          </div>
        )}

        <div className="bg-zinc-900 rounded-lg shadow-lg p-8 border border-zinc-800">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-900/30 text-blue-400 text-sm font-mono rounded-full border border-blue-900/50">
              Code: {event.eventCode || "N/A"}
            </span>
            <span
              className={`px-3 py-1 text-sm rounded-full border ${event.accessType === "invite-only" ? "bg-yellow-900/30 text-yellow-500 border-yellow-900/50" : "bg-green-900/30 text-green-400 border-green-900/50"
                }`}
            >
              {event.accessType === "invite-only" ? "Invite Only" : "Open Event"}
            </span>
            {event.eventType && (
              <span className="px-3 py-1 bg-purple-900/30 text-purple-400 text-sm rounded-full capitalize border border-purple-900/50">
                {event.eventType}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{event.title}</h1>

          {event.description && <p className="text-gray-300 mb-6 text-lg">{event.description}</p>}

          {event.mp4Video && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg bg-black">
              <video controls className="w-full" controlsList="nodownload">
                <source
                  src={event.mp4Video.startsWith("http") ? event.mp4Video : `http://localhost:5000${event.mp4Video}`}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {event.m4Audio && (
            <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-900/50">
              <h3 className="text-lg font-semibold text-white mb-3">Event Audio</h3>
              <audio controls className="w-full" controlsList="nodownload">
                <source
                  src={event.m4Audio.startsWith("http") ? event.m4Audio : `http://localhost:5000${event.m4Audio}`}
                  type="audio/mp4"
                />
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          {event.detailedDescription && (
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <h3 className="text-lg font-semibold text-white mb-2">About This Event</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{event.detailedDescription}</p>
            </div>
          )}

          {event.activitiesAndBenefits && (
            <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-900/50">
              <h3 className="text-lg font-semibold text-white mb-2">Activities & Benefits</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{event.activitiesAndBenefits}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-8 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-gray-400">Date:</span> {formatDate(event.date)}
                </p>
                <p>
                  <span className="font-medium text-gray-400">Time:</span> {event.time || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-400">Venue:</span> {event.venue || "N/A"}
                </p>
                {event.area && (
                  <p>
                    <span className="font-medium text-gray-400">Area:</span> {event.area}
                  </p>
                )}
                <p>
                  <span className="font-medium text-gray-400">Price:</span> ₹{event.price || 0}
                </p>
                <p>
                  <span className="font-medium text-gray-400">Organizer:</span> {event.organizer?.name || "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Availability</h3>
              <p className="text-2xl font-bold text-blue-400 mb-2">
                {event.registeredCount || 0}/{event.capacity || 0} Registered
              </p>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{Math.round(capacityPercentage)}% Capacity</p>

              {(isOrganizer || isCollaborator) && (
                <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <p className="text-sm font-medium text-gray-300 mb-2">Event PINs (Visible to organizers only)</p>
                  <p className="text-sm text-gray-400">
                    <span className="font-medium text-gray-500">Organizer PIN:</span>{" "}
                    <span className="font-mono text-white">{event.organizerPIN || "N/A"}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    <span className="font-medium text-gray-500">Attendee PIN:</span>{" "}
                    <span className="font-mono text-white">{event.attendeePIN || "N/A"}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {isOrganizer ? (
              <>
                <button
                  onClick={() => navigate(`/organizer/event/${id}`)}
                  className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Back to Event Management
                </button>
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
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={registering || (event.capacity && event.registeredCount >= event.capacity)}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering
                    ? "Registering..."
                    : event.capacity && event.registeredCount >= event.capacity
                      ? "Event Full"
                      : event.accessType === "invite-only"
                        ? "Register with PIN"
                        : "Register Now"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4 border border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-4">Enter Attendee PIN</h2>
            <p className="text-gray-400 mb-4">
              This is an invite-only event. Please enter the attendee PIN provided by the organizer.
            </p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-zinc-700 bg-black text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
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
                  className="flex-1 px-4 py-2 bg-zinc-800 text-gray-300 rounded-lg hover:bg-zinc-700 transition"
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
