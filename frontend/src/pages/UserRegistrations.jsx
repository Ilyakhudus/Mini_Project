"use client"

import { useState, useEffect } from "react"
import { registrationsAPI } from "../utils/api"
import Pagination from "../components/Pagination"

export default function UserRegistrations() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchRegistrations()
  }, [page])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const response = await registrationsAPI.getUserRegistrations(page, 10)
      setRegistrations(response.data.registrations)
      setPagination(response.data.pagination)
    } catch (err) {
      console.error("Failed to fetch registrations", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (registrationId) => {
    if (!window.confirm("Are you sure you want to cancel this registration?")) return

    try {
      await registrationsAPI.cancelRegistration(registrationId)
      fetchRegistrations()
    } catch (err) {
      alert("Failed to cancel registration")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Registrations</h1>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No registrations yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div
                  key={registration._id}
                  className="bg-white rounded-lg shadow p-6 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{registration.event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(registration.event.date).toLocaleDateString()} at {registration.event.venue}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">Price: ${registration.event.price}</p>
                  </div>
                  <button
                    onClick={() => handleCancel(registration._id)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Cancel Registration
                  </button>
                </div>
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
