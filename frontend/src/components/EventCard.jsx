"use client"

import { Link } from "react-router-dom"

export default function EventCard({ event }) {
  const capacityPercentage = (event.registeredCount / event.capacity) * 100

  return (
    <Link to={`/events/${event._id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      {event.image && (
        <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-48 object-cover" />
      )}

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p>📅 {new Date(event.date).toLocaleDateString()}</p>
          <p>⏰ {event.time}</p>
          <p>📍 {event.venue}</p>
          <p className="font-bold text-blue-600">${event.price}</p>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Capacity</span>
            <span>
              {event.registeredCount}/{event.capacity}
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
