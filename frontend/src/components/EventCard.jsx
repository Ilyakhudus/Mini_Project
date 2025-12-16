"use client"

import { Link } from "react-router-dom"

export default function EventCard({ event }) {
  const capacityPercentage = event.capacity ? (event.registeredCount / event.capacity) * 100 : 0

  return (
    <Link to={`/events/${event._id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      {event.image && (
        <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-48 object-cover" />
      )}

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">
            {event.eventCode || "N/A"}
          </span>
          {event.accessType === "invite-only" && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">Invite Only</span>
          )}
          {event.eventType && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded capitalize">
              {event.eventType}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p>📅 {new Date(event.date).toLocaleDateString()}</p>
          <p>⏰ {event.time}</p>
          <p>📍 {event.venue}</p>
          {event.area && <p>🗺️ {event.area}</p>}
          <p className="font-bold text-blue-600">₹{event.price || 0}</p>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Capacity</span>
            <span>
              {event.registeredCount || 0}/{event.capacity || 100}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          View Details
        </button>
      </div>
    </Link>
  )
}
