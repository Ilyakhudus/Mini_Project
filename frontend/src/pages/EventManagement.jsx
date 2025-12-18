"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { eventsAPI, messagesAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { formatDate } from "../utils/dateUtils"

export default function EventManagement() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [dashboard, setDashboard] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Task states
  const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "", budget: 0 })
  const [taskLoading, setTaskLoading] = useState(false)

  // Budget states
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "" })
  const [budgetTotal, setBudgetTotal] = useState("")
  const [budgetSpent, setBudgetSpent] = useState("")
  const [budgetIncome, setBudgetIncome] = useState("")

  // Registrations states
  const [registrations, setRegistrations] = useState([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)

  // Messaging states
  const [messageTitle, setMessageTitle] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [messageSending, setMessageSending] = useState(false)
  const [sentMessages, setSentMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

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

  useEffect(() => {
    if (activeTab === "registrations") {
      fetchRegistrations()
      fetchSentMessages()
    }
  }, [activeTab, id])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      const [eventRes, dashboardRes] = await Promise.all([eventsAPI.getEventById(id), eventsAPI.getDashboard(id)])

      setEvent(eventRes.data.event)
      setDashboard(dashboardRes.data.dashboard)
      setBudgetTotal(eventRes.data.event.budget?.total || 0)
      setBudgetSpent(eventRes.data.event.budget?.spent || 0)
      setBudgetIncome(eventRes.data.event.budget?.income || 0)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load event")
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      setRegistrationsLoading(true)
      console.log("[v0] Fetching registrations for event:", id)
      const response = await eventsAPI.getEventRegistrations(id)
      console.log("[v0] Registrations response:", response.data)
      setRegistrations(response.data.registrations || [])
    } catch (err) {
      console.error("[v0] Failed to fetch registrations", err)
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const fetchSentMessages = async () => {
    try {
      console.log("[v0] Fetching sent messages for event:", id)
      const response = await messagesAPI.getEventMessages(id)
      console.log("[v0] Sent messages response:", response.data)
      setSentMessages(response.data.messages || [])
    } catch (err) {
      console.error("[v0] Failed to fetch sent messages", err)
    }
  }

  const handleMarkAttendance = async (userId) => {
    try {
      await eventsAPI.markAttendance(id, userId)
      fetchRegistrations()
      fetchEventData()
    } catch (err) {
      console.error("Failed to mark attendance", err)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    try {
      setTaskLoading(true)
      await eventsAPI.addTask(id, newTask)
      setNewTask({ title: "", description: "", deadline: "", budget: 0 })
      fetchEventData()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add task")
    } finally {
      setTaskLoading(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await eventsAPI.updateTaskStatus(id, taskId, { status })
      fetchEventData()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update task")
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    try {
      await eventsAPI.addExpense(id, newExpense)
      setNewExpense({ description: "", amount: "", category: "" })
      fetchEventData()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add expense")
    }
  }

  const handleUpdateBudgetTotal = async (e) => {
    e.preventDefault()
    try {
      await eventsAPI.updateBudgetTotal(id, { total: Number(budgetTotal) })
      fetchEventData()
      alert("Budget updated successfully")
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update budget")
    }
  }

  const handleUpdateBudgetSpent = async (e) => {
    e.preventDefault()
    try {
      await eventsAPI.updateBudgetSpent(id, { spent: Number(budgetSpent) })
      fetchEventData()
      alert("Spent amount updated successfully")
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update spent amount")
    }
  }

  const handleUpdateBudgetIncome = async (e) => {
    e.preventDefault()
    try {
      await eventsAPI.updateBudgetIncome(id, { income: Number(budgetIncome) })
      fetchEventData()
      alert("Income updated successfully")
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update income")
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert("Please enter both title and message content")
      return
    }

    try {
      setMessageSending(true)
      const response = await messagesAPI.sendMessage(id, {
        title: messageTitle,
        content: messageContent,
      })
      alert(`Message sent to ${response.data.recipientCount} attendee(s)`)
      setMessageTitle("")
      setMessageContent("")
      fetchSentMessages()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send message")
    } finally {
      setMessageSending(false)
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg">
          {error}
          <button onClick={() => navigate("/organizer")} className="ml-4 underline">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const remainingBudget = (event.budget?.income || 0) - (event.budget?.spent || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/organizer" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
                ← Back to Organizer Hub
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-mono rounded">{event.eventCode}</span>
                <span className="text-gray-500">{formatDate(event.date)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/events/${id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                View Public Page
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {["dashboard", "tasks", "budget", "registrations", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium capitalize whitespace-nowrap ${
                  activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Registered</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard.attendees?.registered || 0}</p>
                <p className="text-sm text-gray-400">of {event.capacity} capacity</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Attended</p>
                <p className="text-3xl font-bold text-green-600">{dashboard.attendees?.attending || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Tasks Completed</p>
                <p className="text-3xl font-bold text-purple-600">
                  {event.tasks?.filter((t) => t.status === "completed").length || 0}/{event.tasks?.length || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Budget Remaining</p>
                <p className={`text-3xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Attendance Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Registration Progress</span>
                    <span className="text-sm font-medium">
                      {Math.round(((dashboard.attendees?.registered || 0) / event.capacity) * 100)}% filled
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{
                        width: `${Math.min(((dashboard.attendees?.registered || 0) / event.capacity) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="text-sm font-medium">
                      {dashboard.attendees?.registered > 0
                        ? Math.round(((dashboard.attendees?.attending || 0) / dashboard.attendees?.registered) * 100)
                        : 0}
                      % attended
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{
                        width: `${dashboard.attendees?.registered > 0 ? Math.min(((dashboard.attendees?.attending || 0) / dashboard.attendees?.registered) * 100, 100) : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* PIN Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Access PINs</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Organizer PIN</p>
                  <p className="text-2xl font-mono font-bold text-blue-900">{event.organizerPIN}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Attendee PIN</p>
                  <p className="text-2xl font-mono font-bold text-green-900">{event.attendeePIN}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Add Task Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 mb-1 block">Task Budget (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newTask.budget}
                      onChange={(e) => setNewTask({ ...newTask, budget: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={taskLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-6"
                  >
                    {taskLoading ? "Adding..." : "Add Task"}
                  </button>
                </div>
              </form>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Tasks ({event.tasks?.length || 0})</h3>
              {event.tasks && event.tasks.length > 0 ? (
                <div className="space-y-3">
                  {event.tasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
                          {task.budget > 0 && <span>Budget: ₹{task.budget}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : task.status === "in-progress"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {task.status}
                        </span>
                        {task.status !== "completed" && (
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
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
            {/* Budget Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Assigned Budget</p>
                <p className="text-2xl font-bold text-blue-600">₹{(event.budget?.total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Income</p>
                <p className="text-2xl font-bold text-green-600">₹{(event.budget?.income || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Spent</p>
                <p className="text-2xl font-bold text-red-600">₹{(event.budget?.spent || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Remaining (Income - Spent)</p>
                <p className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Budget Management Forms */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Update Assigned Budget */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Update Assigned Budget</h3>
                <form onSubmit={handleUpdateBudgetTotal} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Assigned Budget (₹)</label>
                    <input
                      type="number"
                      value={budgetTotal}
                      onChange={(e) => setBudgetTotal(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Budget
                  </button>
                </form>
              </div>

              {/* Update Income */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Update Income</h3>
                <form onSubmit={handleUpdateBudgetIncome} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Total Income (₹)</label>
                    <input
                      type="number"
                      value={budgetIncome}
                      onChange={(e) => setBudgetIncome(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Update Income
                  </button>
                </form>
              </div>

              {/* Update Spent */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Update Spent Amount</h3>
                <form onSubmit={handleUpdateBudgetSpent} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Total Spent (₹)</label>
                    <input
                      type="number"
                      value={budgetSpent}
                      onChange={(e) => setBudgetSpent(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                  <button type="submit" className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Update Spent
                  </button>
                </form>
              </div>
            </div>

            {/* Add Expense */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Add Individual Expense</h3>
              <form onSubmit={handleAddExpense} className="grid md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Category</option>
                  <option value="venue">Venue</option>
                  <option value="catering">Catering</option>
                  <option value="equipment">Equipment</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Expense
                </button>
              </form>
            </div>

            {/* Expense History */}
            {event.budget?.expenses && event.budget.expenses.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Expense History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Description</th>
                        <th className="text-left py-2 px-4">Category</th>
                        <th className="text-left py-2 px-4">Amount</th>
                        <th className="text-left py-2 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.budget.expenses.map((expense, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{expense.description}</td>
                          <td className="py-2 px-4 capitalize">{expense.category || "-"}</td>
                          <td className="py-2 px-4">₹{expense.amount}</td>
                          <td className="py-2 px-4">{formatDate(expense.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === "registrations" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Registration Overview</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Registered</p>
                  <p className="text-2xl font-bold text-blue-900">{dashboard.attendees?.registered || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Attended</p>
                  <p className="text-2xl font-bold text-green-900">{dashboard.attendees?.attending || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{event.capacity}</p>
                </div>
              </div>

              {/* Attendance Bar */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Registration Progress</span>
                    <span className="text-sm font-medium">
                      {Math.round(((dashboard.attendees?.registered || 0) / event.capacity) * 100)}% filled
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{
                        width: `${Math.min(((dashboard.attendees?.registered || 0) / event.capacity) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="text-sm font-medium">
                      {dashboard.attendees?.registered > 0
                        ? Math.round(((dashboard.attendees?.attending || 0) / dashboard.attendees?.registered) * 100)
                        : 0}
                      % attended
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{
                        width: `${dashboard.attendees?.registered > 0 ? Math.min(((dashboard.attendees?.attending || 0) / dashboard.attendees?.registered) * 100, 100) : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Send Message to Attendees</h3>
              <p className="text-sm text-gray-500 mb-4">
                Send updates or announcements to all registered attendees. Messages will appear in their Updates tab.
              </p>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Message Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Important Update About the Event"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Message Content</label>
                  <textarea
                    placeholder="Write your message here..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={messageSending || registrations.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {messageSending ? "Sending..." : `Send to ${registrations.length} Attendee(s)`}
                </button>
              </form>

              {/* Sent Messages History */}
              {sentMessages.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-medium mb-3">Sent Messages</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sentMessages.map((msg) => (
                      <div key={msg._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-gray-900">{msg.title}</h5>
                          <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.content}</p>
                        <p className="text-xs text-gray-400 mt-2">Sent to {msg.recipients?.length || 0} recipient(s)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Registered Users List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Registered Attendees</h3>
              {registrationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Registered At</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Attendance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => (
                        <tr key={reg._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {reg.user?.name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <span className="font-medium">{reg.user?.name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{reg.user?.email || "N/A"}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{formatDate(reg.registeredAt)}</td>
                          <td className="py-3 px-4">
                            {reg.hasAttended ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Attended
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Not Attended
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {!reg.hasAttended && (
                              <button
                                onClick={() => handleMarkAttendance(reg.user._id)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Mark Present
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No registrations yet</p>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
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
