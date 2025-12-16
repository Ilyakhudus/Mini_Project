"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { eventsAPI } from "../utils/api"

export default function EventManagement() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [event, setEvent] = useState(null)
  const [dashboard, setDashboard] = useState({
    tasks: { total: 0, completed: 0, pending: 0 },
    collaborators: [],
    budget: { projected: 0, spent: 0, remaining: 0 },
    attendees: { registered: 0, attending: 0 },
    feedback: { positive: 0, neutral: 0, negative: 0, total: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    budget: 0,
    deadline: "",
  })
  const [taskError, setTaskError] = useState("")
  const [taskSuccess, setTaskSuccess] = useState("")

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    recipientType: "attendee",
    customMessage: "",
  })
  const [generatedInvite, setGeneratedInvite] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  const [settingsForm, setSettingsForm] = useState({
    accessType: "open",
    budget: 0,
    capacity: 100,
    status: "upcoming",
  })
  const [settingsError, setSettingsError] = useState("")
  const [settingsSuccess, setSettingsSuccess] = useState("")
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => {
    fetchEventData()
  }, [id])

  useEffect(() => {
    if (event) {
      setSettingsForm({
        accessType: event.accessType || "open",
        budget: event.budget?.total || 0,
        capacity: event.capacity || 100,
        status: event.status || "upcoming",
      })
    }
  }, [event])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      const [eventRes, dashboardRes] = await Promise.all([
        eventsAPI.getEventById(id),
        eventsAPI.getDashboard(id).catch(() => ({ data: { dashboard: null } })),
      ])

      setEvent(eventRes.data.event)
      if (dashboardRes.data.dashboard) {
        setDashboard(dashboardRes.data.dashboard)
      }
    } catch (err) {
      setError("Failed to load event data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setTaskError("")
    setTaskSuccess("")

    if (!taskForm.title) {
      setTaskError("Task title is required")
      return
    }

    try {
      await eventsAPI.addTask(id, taskForm)
      setTaskSuccess("Task created successfully!")
      setTaskForm({ title: "", description: "", budget: 0, deadline: "" })
      fetchEventData()
    } catch (err) {
      setTaskError(err.response?.data?.error || "Failed to create task")
    }
  }

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await eventsAPI.updateTaskStatus(id, taskId, { status: newStatus })
      fetchEventData()
    } catch (err) {
      setTaskError(err.response?.data?.error || "Failed to update task status")
    }
  }

  const handleGenerateInvite = async (e) => {
    e.preventDefault()
    setInviteError("")
    setInviteSuccess("")
    setGeneratedInvite("")

    try {
      const response = await eventsAPI.generateInvite(id, inviteForm.recipientType, inviteForm.customMessage)
      setGeneratedInvite(response.data.inviteMessage)
      setInviteSuccess("Invite generated successfully!")
    } catch (err) {
      setInviteError(err.response?.data?.error || "Failed to generate invite. Please try again.")
    }
  }

  const copyInvite = () => {
    navigator.clipboard.writeText(generatedInvite)
    setInviteSuccess("Invite copied to clipboard!")
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setSettingsError("")
    setSettingsSuccess("")
    setSettingsLoading(true)

    try {
      const updateData = {
        accessType: settingsForm.accessType,
        budget: Number(settingsForm.budget),
        capacity: Number(settingsForm.capacity),
        status: settingsForm.status,
      }
      console.log("[v0] Updating settings with data:", updateData)
      const response = await eventsAPI.updateEvent(id, updateData)
      console.log("[v0] Update response:", response.data)
      setSettingsSuccess("Settings updated successfully!")
      setEvent(response.data.event)
    } catch (err) {
      console.error("[v0] Failed to update settings:", err)
      setSettingsError(err.response?.data?.error || "Failed to update settings")
    } finally {
      setSettingsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Event not found"}</p>
          <button onClick={() => navigate("/organizer")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Hub
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "tasks", label: "Tasks" },
    { id: "budget", label: "Budget" },
    { id: "collaborators", label: "Collaborators" },
    { id: "registrations", label: "Registrations" },
    { id: "invites", label: "Invites" },
    { id: "settings", label: "Settings" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={() => navigate("/organizer")} className="text-blue-600 hover:underline mb-2 text-sm">
                &larr; Back to Organizer Hub
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Code: {event.eventCode || "N/A"}</span>
                <span>|</span>
                <span>{new Date(event.date).toLocaleDateString()}</span>
                <span>|</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${event.accessType === "invite-only" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                >
                  {event.accessType === "invite-only" ? "Invite Only" : "Open"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.tasks?.total || 0}</p>
                <p className="text-sm text-green-600 mt-1">{dashboard.tasks?.completed || 0} completed</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Registrations</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.attendees?.registered || 0}</p>
                <p className="text-sm text-gray-500 mt-1">of {event.capacity} capacity</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{event.budget?.total || dashboard.budget?.projected || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">₹{dashboard.budget?.spent || 0} spent</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Collaborators</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{event.collaborators?.length || 0}</p>
              </div>
            </div>

            {/* PINs Display */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Access Credentials</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Organizer PIN</p>
                  <p className="text-2xl font-mono font-bold text-blue-900">{event.organizerPIN || "N/A"}</p>
                  <p className="text-xs text-blue-600 mt-1">Share with collaborators</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Attendee PIN</p>
                  <p className="text-2xl font-mono font-bold text-green-900">{event.attendeePIN || "N/A"}</p>
                  <p className="text-xs text-green-600 mt-1">Share with attendees</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Create Task Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
              {taskError && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{taskError}</div>}
              {taskSuccess && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{taskSuccess}</div>}
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
                    <input
                      type="number"
                      value={taskForm.budget}
                      onChange={(e) => setTaskForm({ ...taskForm, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Task description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Task
                </button>
              </form>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Tasks ({event.tasks?.length || 0})</h3>
              {event.tasks && event.tasks.length > 0 ? (
                <div className="space-y-3">
                  {event.tasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {task.budget > 0 && <span>Budget: ₹{task.budget}</span>}
                            {task.deadline && <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                          className={`px-3 py-1 rounded text-sm ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in-progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No tasks created yet</p>
              )}
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Budget</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{event.budget?.total || dashboard.budget?.projected || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Spent</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">₹{dashboard.budget?.spent || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Remaining</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹{(event.budget?.total || dashboard.budget?.projected || 0) - (dashboard.budget?.spent || 0)}
                </p>
              </div>
            </div>

            {/* Task Budget Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Budget by Task</h3>
              {event.tasks && event.tasks.length > 0 ? (
                <div className="space-y-3">
                  {event.tasks
                    .filter((t) => t.budget > 0)
                    .map((task) => (
                      <div key={task._id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-500">{task.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{task.budget}</p>
                          <p className="text-sm text-gray-500">Spent: ₹{task.spent || 0}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No budget items</p>
              )}
            </div>
          </div>
        )}

        {/* Collaborators Tab */}
        {activeTab === "collaborators" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Collaborators ({event.collaborators?.length || 0})</h3>
            {event.collaborators && event.collaborators.length > 0 ? (
              <div className="space-y-3">
                {event.collaborators.map((collab, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">{collab.userId?.name?.charAt(0) || "U"}</span>
                      </div>
                      <div>
                        <p className="font-medium">{collab.userId?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-500">{collab.userId?.email || ""}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Added {new Date(collab.addedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No collaborators added yet</p>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === "registrations" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Registrations</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Registered</p>
                <p className="text-2xl font-bold text-blue-900">{dashboard.attendees?.registered || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Capacity</p>
                <p className="text-2xl font-bold text-green-900">{event.capacity}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${Math.min(((dashboard.attendees?.registered || 0) / event.capacity) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {Math.round(((dashboard.attendees?.registered || 0) / event.capacity) * 100)}% capacity filled
            </p>
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === "invites" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Invite</h3>
            <p className="text-gray-600 mb-6">
              Generate an invite message that automatically includes the event code and PIN for easy sharing.
            </p>

            {inviteError && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{inviteError}</div>}
            {inviteSuccess && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{inviteSuccess}</div>}

            <form onSubmit={handleGenerateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                <select
                  value={inviteForm.recipientType}
                  onChange={(e) => setInviteForm({ ...inviteForm, recipientType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="attendee">Attendee (will receive Attendee PIN)</option>
                  <option value="collaborator">Collaborator (will receive Organizer PIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message (optional)</label>
                <textarea
                  value={inviteForm.customMessage}
                  onChange={(e) => setInviteForm({ ...inviteForm, customMessage: e.target.value })}
                  placeholder={`You're invited to ${event.title}!`}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Generate Invite
              </button>
            </form>

            {generatedInvite && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Generated Invite Message</label>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap border">
                  {generatedInvite}
                </div>
                <button
                  onClick={copyInvite}
                  className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Event Settings</h3>
            <p className="text-gray-600 mb-6">Update event settings including access type, budget, and capacity.</p>

            {settingsError && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{settingsError}</div>}
            {settingsSuccess && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{settingsSuccess}</div>}

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Type</label>
                  <select
                    value={settingsForm.accessType}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accessType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open (Anyone can register)</option>
                    <option value="invite-only">Invite Only (Requires PIN)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {settingsForm.accessType === "invite-only"
                      ? "Attendees will need the PIN to register"
                      : "Anyone can register without a PIN"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Status</label>
                  <select
                    value={settingsForm.status}
                    onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (₹)</label>
                  <input
                    type="number"
                    value={settingsForm.budget}
                    onChange={(e) => setSettingsForm({ ...settingsForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current spent: ₹{dashboard.budget?.spent || 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input
                    type="number"
                    value={settingsForm.capacity}
                    onChange={(e) => setSettingsForm({ ...settingsForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Currently registered: {dashboard.attendees?.registered || 0}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {settingsLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>

            {/* Event Credentials (Read-only) */}
            <div className="mt-8 border-t pt-6">
              <h4 className="text-md font-semibold mb-4">Event Credentials (Read-only)</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Event Code</p>
                  <p className="text-xl font-mono font-bold">{event.eventCode || "N/A"}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Organizer PIN</p>
                  <p className="text-xl font-mono font-bold text-blue-900">{event.organizerPIN || "N/A"}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Attendee PIN</p>
                  <p className="text-xl font-mono font-bold text-green-900">{event.attendeePIN || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
