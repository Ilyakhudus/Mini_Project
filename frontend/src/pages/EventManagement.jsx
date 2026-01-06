"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { eventsAPI, messagesAPI, pollsAPI } from "../utils/api" // Added pollsAPI
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
  // messageType: 'text' | 'poll' | 'media'
  const [messageType, setMessageType] = useState("text")
  // Poll fields for composer
  const [pollOptions, setPollOptions] = useState(["", ""])
  const [pollMultiSelect, setPollMultiSelect] = useState(false)
  // Media message helper fields (simple URL-based for now)
  const [mediaType, setMediaType] = useState("image")
  const [mediaUrl, setMediaUrl] = useState("")
  const [messageSending, setMessageSending] = useState(false)
  const [sentMessages, setSentMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Poll states
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""] })
  const [polls, setPolls] = useState([])
  const [loadingPolls, setLoadingPolls] = useState(false)

  const [settingsForm, setSettingsForm] = useState({
    accessType: "open",
    budget: 0,
    capacity: 100,
    status: "upcoming",
    date: "",
    time: "",
    venue: "",
    inviteMessage: "", // Added inviteMessage state
    description: "", // Added description state
    m4Audio: "",
    mp4Video: "", // added mp4Video field to state
    mp4VideoUrl: "",
    m4AudioUrl: "",
  })
  const [settingsError, setSettingsError] = useState("")
  const [settingsSuccess, setSettingsSuccess] = useState("")
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [individualIncome, setIndividualIncome] = useState("")

  const [mediaFiles, setMediaFiles] = useState({
    mp4Video: null,
    m4Audio: null,
  })

  useEffect(() => {
    fetchEventData()
    fetchPolls() // Fetch polls when component mounts
  }, [id])

  useEffect(() => {
    if (event) {
      let eventDate = ""
      if (event.date) {
        const dateStr = typeof event.date === "string" ? event.date : new Date(event.date).toISOString()
        eventDate = dateStr.split("T")[0] // Extract YYYY-MM-DD part
      }
      setSettingsForm({
        accessType: event.accessType || "open",
        budget: event.budget?.total || 0,
        capacity: event.capacity || 100,
        status: event.status || "upcoming",
        date: eventDate,
        time: event.time || "",
        venue: event.venue || "",
        inviteMessage: event.inviteMessage || "",
        description: event.description || "",
        m4Audio: event.m4Audio || "",
        mp4Video: event.mp4Video || "", // initialize mp4Video from event
        mp4VideoUrl: event.mp4VideoUrl || "",
        m4AudioUrl: event.m4AudioUrl || "",
      })
    }
  }, [event])

  useEffect(() => {
    if (activeTab === "registrations") {
      fetchRegistrations()
      fetchSentMessages()
    } else if (activeTab === "polls") {
      fetchPolls() // Ensure polls are fetched if the tab becomes active
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

  const fetchPolls = async () => {
    setLoadingPolls(true)
    setError(null)
    try {
      console.log("[v0] fetchPolls - eventId:", id)
      console.log("[v0] fetchPolls - making API call to /polls/event/" + id)

      const response = await pollsAPI.getEventPolls(id)

      console.log("[v0] fetchPolls - response received:", response)
      const pollsData = response.data?.data || response.data?.polls || response.data || []
      setPolls(Array.isArray(pollsData) ? pollsData : [])
    } catch (err) {
      console.log("[v0] fetchPolls - error caught:", err)
      console.log("[v0] fetchPolls - error response:", err.response)
      const errorMsg = err.response?.data?.error || err.message || "Failed to fetch polls"
      setError(errorMsg)
      setPolls([])
    } finally {
      setLoadingPolls(false)
    }
  }

  // Create a new poll
  const handleCreatePoll = async () => {
    if (!pollForm.question.trim() || pollForm.options.some((opt) => !opt.trim()) || pollForm.options.length < 2) {
      alert("Please provide a question and at least two options for the poll.")
      return
    }
    setLoadingPolls(true)
    try {
      await pollsAPI.createPoll(id, pollForm)
      alert("Poll created successfully!")
      setPollForm({ question: "", options: ["", ""] }) // Reset form
      fetchPolls() // Refresh poll list
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create poll")
    } finally {
      setLoadingPolls(false)
    }
  }

  // Close a poll
  const handleClosePoll = async (pollId) => {
    setLoadingPolls(true)
    try {
      await pollsAPI.closePoll(pollId)
      alert("Poll closed successfully!")
      fetchPolls() // Refresh poll list
    } catch (err) {
      alert(err.response?.data?.error || "Failed to close poll")
    } finally {
      setLoadingPolls(false)
    }
  }

  // Delete a poll
  const handleDeletePoll = async (pollId) => {
    setLoadingPolls(true)
    try {
      await pollsAPI.deletePoll(pollId)
      alert("Poll deleted successfully!")
      fetchPolls() // Refresh poll list
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete poll")
    } finally {
      setLoadingPolls(false)
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

  const handleAddIndividualIncome = async (e) => {
    e.preventDefault()
    if (!individualIncome || individualIncome <= 0) {
      alert("Please enter a valid income amount")
      return
    }
    try {
      const currentIncome = event.budget?.income || 0
      await eventsAPI.updateBudgetIncome(id, { income: Number(currentIncome) + Number(individualIncome) })
      setIndividualIncome("")
      fetchEventData()
      alert("Individual income added successfully")
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add income")
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    // Basic validation depending on message type
    if (!messageTitle.trim()) {
      alert("Please enter a message title")
      return
    }

    if (messageType === "text" && !messageContent.trim()) {
      alert("Please enter message content for text messages")
      return
    }

    if (messageType === "poll") {
      const validOptions = pollOptions.map((o) => o.trim()).filter((o) => o)
      if (validOptions.length < 2) {
        alert("Please provide at least two poll options")
        return
      }
    }

    try {
      setMessageSending(true)

      const payload = {
        title: messageTitle,
        content: messageContent,
        messageType,
      }

      if (messageType === "poll") {
        payload.pollOptions = pollOptions.map((o) => o.trim()).filter((o) => o)
        payload.pollMultiSelect = pollMultiSelect
      }

      if (messageType === "media") {
        payload.mediaUrl = mediaUrl
        payload.mediaType = mediaType
      }

      const response = await messagesAPI.sendMessage(id, payload)

      alert(`Message sent to ${response.data.recipientCount} attendee(s)`)
      // Reset composer fields
      setMessageTitle("")
      setMessageContent("")
      setMessageType("text")
      setPollOptions(["", ""])
      setPollMultiSelect(false)
      setMediaUrl("")
      setMediaType("image")

      fetchSentMessages()
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send message")
    } finally {
      setMessageSending(false)
    }
  }

  const handleMediaFileChange = (e, fileType) => {
    const file = e.target.files[0]
    if (file) {
      setMediaFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }))
    }
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setSettingsError("")
    setSettingsSuccess("")
    setSettingsLoading(true)

    try {
      const formData = new FormData()
      formData.append("accessType", settingsForm.accessType)
      formData.append("budget", settingsForm.budget)
      formData.append("capacity", settingsForm.capacity)
      formData.append("status", settingsForm.status)
      formData.append("date", settingsForm.date) // Send as YYYY-MM-DD string, not Date object
      formData.append("time", settingsForm.time)
      formData.append("venue", settingsForm.venue)
      formData.append("inviteMessage", settingsForm.inviteMessage)
      formData.append("description", settingsForm.description)
      formData.append("mp4VideoUrl", settingsForm.mp4VideoUrl)
      formData.append("m4AudioUrl", settingsForm.m4AudioUrl)

      if (mediaFiles.mp4Video) {
        formData.append("mp4Video", mediaFiles.mp4Video)
      }
      if (mediaFiles.m4Audio) {
        formData.append("m4Audio", mediaFiles.m4Audio)
      }

      console.log("[v0] Updating settings with data:", formData) // Log FormData to inspect
      const response = await eventsAPI.updateEvent(id, formData)
      console.log("[v0] Update response:", response.data)
      setSettingsSuccess("Settings updated successfully!")
      setEvent(response.data.event)
      setMediaFiles({ mp4Video: null, m4Audio: null }) // Clear selected files after successful upload
    } catch (err) {
      console.error("[v0] Failed to update settings:", err)
      setSettingsError(err.response?.data?.error || "Failed to update settings")
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleGenerateInvite = async () => {
    try {
      const response = await eventsAPI.generateInvite(id, "all", "")
      alert(
        `Invite generated!\n\nEvent Code: ${event.eventCode}\nOrganizer PIN: ${event.organizerPIN}\nAttendee PIN: ${event.attendeePIN}`,
      )
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate invite")
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900 border border-red-900/50 text-red-500 p-6 rounded-lg">
          {error}
          <button onClick={() => navigate("/organizer")} className="ml-4 underline hover:text-red-400">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const remainingBudget = (event.budget?.total || 0) + (event.budget?.income || 0) - (event.budget?.spent || 0)

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/organizer" className="text-green-500 hover:underline text-sm mb-2 inline-block">
                ← Back to Organizer Hub
              </Link>
              <h1 className="text-2xl font-bold text-white">{event.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-900/50 text-sm font-mono rounded">{event.eventCode}</span>
                <span className="text-gray-400">{formatDate(event.date)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/events/${id}`}
                className="px-4 py-2 border border-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                View Public Page
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {["dashboard", "tasks", "budget", "registrations", "polls", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium capitalize whitespace-nowrap transition-colors ${activeTab === tab ? "text-green-500 border-b-2 border-green-500" : "text-gray-400 hover:text-gray-200"
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Registered</p>
                <p className="text-3xl font-bold text-blue-500">{dashboard.attendees?.registered || 0}</p>
                <p className="text-sm text-gray-500">of {event.capacity} capacity</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Attended</p>
                <p className="text-3xl font-bold text-green-500">{dashboard.attendees?.attending || 0}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Tasks Completed</p>
                <p className="text-3xl font-bold text-purple-500">
                  {event.tasks?.filter((t) => t.status === "completed").length || 0}/{event.tasks?.length || 0}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Budget Remaining</p>
                <p className={`text-3xl font-bold ${remainingBudget >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ₹{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Polls Section on Dashboard - ADDED */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Existing Attendance Progress */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Attendance Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Registration Progress</span>
                      <span className="text-sm font-medium text-gray-200">
                        {Math.round(((dashboard.attendees?.registered || 0) / event.capacity) * 100)}% filled
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-3">
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
                      <span className="text-sm text-gray-400">Attendance Rate</span>
                      <span className="text-sm font-medium text-gray-200">
                        {dashboard.attendees?.registered > 0
                          ? Math.round(((dashboard.attendees?.attending || 0) / dashboard.attendees?.registered) * 100)
                          : 0}
                        % attended
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-3">
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

              {/* Polls Widget */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Active Polls Preview</h3>
                {dashboard.polls && dashboard.polls.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {dashboard.polls.map((poll) => (
                      <div key={poll._id} className="p-3 bg-black border border-zinc-800 rounded-lg">
                        <p className="font-medium text-gray-200 mb-2">{poll.question}</p>
                        <div className="space-y-2">
                          {poll.options.map((opt, idx) => (
                            <div key={idx} className="relative pt-1">
                              <div className="flex mb-1 items-center justify-between">
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-200 bg-green-900/30">
                                  {opt.optionText}
                                </span>
                                <span className="text-xs font-semibold inline-block text-green-200">
                                  {opt.percentage}%
                                </span>
                              </div>
                              <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-zinc-800">
                                <div style={{ width: `${opt.percentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">{poll.totalResponses} responses</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <p>No active polls</p>
                    <button onClick={() => setActiveTab("polls")} className="mt-2 text-green-500 text-sm hover:underline">Create a poll</button>
                  </div>
                )}
              </div>
            </div>

            {/* PIN Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Access PINs</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-400 mb-1">Organizer PIN</p>
                  <p className="text-2xl font-mono font-bold text-blue-300">{event.organizerPIN}</p>
                </div>
                <div className="p-4 bg-green-900/20 border border-green-900/30 rounded-lg">
                  <p className="text-sm text-green-400 mb-1">Attendee PIN</p>
                  <p className="text-2xl font-mono font-bold text-green-300">{event.attendeePIN}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Add Task Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Add New Task</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-gray-500"
                    required
                  />
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-gray-500"
                  rows={2}
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-gray-400 mb-1 block">Task Budget (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newTask.budget}
                      onChange={(e) => setNewTask({ ...newTask, budget: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={taskLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mt-6"
                  >
                    {taskLoading ? "Adding..." : "Add Task"}
                  </button>
                </div>
              </form>
            </div>

            {/* Task List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Tasks ({event.tasks?.length || 0})</h3>
              {event.tasks && event.tasks.length > 0 ? (
                <div className="space-y-3">
                  {event.tasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-4 border border-zinc-700 rounded-lg bg-black">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{task.title}</h4>
                        {task.description && <p className="text-sm text-gray-400">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
                          {task.budget > 0 && <span>Budget: ₹{task.budget}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${task.status === "completed"
                            ? "bg-green-900/30 text-green-400 border border-green-800"
                            : task.status === "in-progress"
                              ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                              : "bg-zinc-800 text-gray-400 border border-zinc-700"
                            }`}
                        >
                          {task.status}
                        </span>
                        {task.status !== "completed" && (
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                            className="text-sm bg-black border border-zinc-700 text-white rounded px-2 py-1 focus:border-green-500"
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Assigned Budget</p>
                <p className="text-2xl font-bold text-blue-400">₹{(event.budget?.total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Income</p>
                <p className="text-2xl font-bold text-green-400">₹{(event.budget?.income || 0).toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Spent</p>
                <p className="text-2xl font-bold text-red-400">₹{(event.budget?.spent || 0).toLocaleString()}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <p className="text-sm text-gray-400">Remaining (Assigned + Income - Spent)</p>
                <p className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Budget Management Forms */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Update Assigned Budget */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Update Assigned Budget</h3>
                <form onSubmit={handleUpdateBudgetTotal} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Assigned Budget (₹)</label>
                    <input
                      type="number"
                      value={budgetTotal}
                      onChange={(e) => setBudgetTotal(e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Update Total Income</h3>
                <form onSubmit={handleUpdateBudgetIncome} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Total Income (₹)</label>
                    <input
                      type="number"
                      value={budgetIncome}
                      onChange={(e) => setBudgetIncome(e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
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

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Add Individual Income</h3>
                <form onSubmit={handleAddIndividualIncome} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Income Amount (₹)</label>
                    <input
                      type="number"
                      value={individualIncome}
                      onChange={(e) => setIndividualIncome(e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      min="0"
                      placeholder="Enter amount to add"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Add Income
                  </button>
                </form>
              </div>

              {/* Update Spent */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Update Spent Amount</h3>
                <form onSubmit={handleUpdateBudgetSpent} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Total Spent (₹)</label>
                    <input
                      type="number"
                      value={budgetSpent}
                      onChange={(e) => setBudgetSpent(e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Add Individual Expense</h3>
              <form onSubmit={handleAddExpense} className="grid md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-blue-500"
                  required
                />
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-blue-500"
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
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Expense History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-300">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-2 px-4">Description</th>
                        <th className="text-left py-2 px-4">Category</th>
                        <th className="text-left py-2 px-4">Amount</th>
                        <th className="text-left py-2 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.budget.expenses.map((expense, index) => (
                        <tr key={index} className="border-b border-zinc-800">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Registration Overview</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-900/30">
                  <p className="text-sm text-blue-400">Registered</p>
                  <p className="text-2xl font-bold text-blue-300">{dashboard.attendees?.registered || 0}</p>
                </div>
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-900/30">
                  <p className="text-sm text-green-400">Attended</p>
                  <p className="text-2xl font-bold text-green-300">{dashboard.attendees?.attending || 0}</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <p className="text-sm text-gray-400">Capacity</p>
                  <p className="text-2xl font-bold text-gray-200">{event.capacity}</p>
                </div>
              </div>

              {/* Attendance Bar */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Registration Progress</span>
                    <span className="text-sm font-medium text-gray-300">
                      {Math.round(((dashboard.attendees?.registered || 0) / event.capacity) * 100)}% filled
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3">
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
                    <span className="text-sm text-gray-400">Attendance Rate</span>
                    <span className="text-sm font-medium text-gray-300">
                      {dashboard.attendees?.registered > 0
                        ? Math.round(((dashboard.attendees?.attending || 0) / dashboard.attendees?.registered) * 100)
                        : 0}
                      % attended
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3">
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

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Send Message to Attendees</h3>
              <p className="text-sm text-gray-400 mb-4">
                Send updates or announcements to all registered attendees. Messages will appear in their Updates tab.
              </p>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Message Type</label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="text">Text</option>
                    <option value="poll">Poll</option>
                    <option value="media">Media</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Message Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Important Update About the Event"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Message Content (optional)</label>
                  <textarea
                    placeholder="Write your message here..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:border-purple-500"
                    rows={3}
                  />
                </div>

                {messageType === "poll" && (
                  <div className="space-y-3">
                    <label className="text-sm text-gray-400 mb-1 block">Poll Options</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions]
                            newOpts[idx] = e.target.value
                            setPollOptions(newOpts)
                          }}
                          className="flex-1 px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                            className="px-3 py-1 bg-red-600 text-white rounded"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Add Option
                      </button>
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <input type="checkbox" checked={pollMultiSelect} onChange={(e) => setPollMultiSelect(e.target.checked)} />
                        Allow multiple selection
                      </label>
                    </div>
                  </div>
                )}

                {messageType === "media" && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Media Type</label>
                    <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white">
                      <option value="image">Image</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                    </select>

                    <label className="text-sm text-gray-400 mb-1 block mt-3">Media URL</label>
                    <input type="text" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white" placeholder="https://..." />
                  </div>
                )}

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
                <div className="mt-6 border-t border-zinc-800 pt-6">
                  <h4 className="font-medium mb-3 text-white">Sent Messages</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sentMessages.map((msg) => (
                      <div key={msg._id} className="p-3 bg-black border border-zinc-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-gray-200">{msg.title}</h5>
                          <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{msg.content}</p>
                        {msg.messageType === "poll" && msg.pollOptions && (
                          <div className="mt-3 space-y-2">
                            {msg.pollOptions.map((opt, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                                <span>{opt.text}</span>
                                <span className="text-gray-400">{(opt.votes || []).length} votes</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Sent to {msg.recipients?.length || 0} recipient(s)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Registered Users List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Registered Attendees</h3>
              {registrationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-gray-300">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Registered At</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Attendance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => (
                        <tr key={reg._id} className="border-b border-zinc-800 hover:bg-zinc-800">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-900/40 rounded-full flex items-center justify-center">
                                <span className="text-blue-400 font-medium text-sm">
                                  {reg.user?.name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <span className="font-medium text-white">{reg.user?.name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">{reg.user?.email || "N/A"}</td>
                          <td className="py-3 px-4 text-sm text-gray-400">{formatDate(reg.registeredAt)}</td>
                          <td className="py-3 px-4">
                            {reg.hasAttended ? (
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-800 text-xs rounded-full">
                                Attended
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-zinc-800 text-gray-400 border border-zinc-700 text-xs rounded-full">
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

        {/* Polls Tab */}
        {activeTab === "polls" && (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
                <span>{error}</span>
                <button onClick={fetchPolls} className="text-red-500 hover:text-red-400 font-semibold">
                  Retry
                </button>
              </div>
            )}

            {loadingPolls ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Create Poll Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Create New Poll</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleCreatePoll()
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Poll Question</label>
                      <input
                        type="text"
                        value={pollForm.question}
                        onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                        className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter poll question"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Options</label>
                      {pollForm.options.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...pollForm.options]
                            newOptions[index] = e.target.value
                            setPollForm({ ...pollForm, options: newOptions })
                          }}
                          className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 mb-2"
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })}
                        className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Create Poll
                    </button>
                  </form>
                </div>

                {/* Existing Polls */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Active Polls</h3>
                  {polls.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No polls created yet</p>
                  ) : (
                    <div className="space-y-4">
                      {polls.map((poll) => (
                        <div key={poll._id} className="p-4 border border-zinc-700 rounded-lg bg-black">
                          <h4 className="font-semibold text-white">{poll.question}</h4>
                          <p className="text-sm text-gray-400 mt-1">{poll.responses?.length || 0} responses</p>
                          <div className="mt-4 space-y-2">
                            {poll.options?.map((option, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">{option.optionText}</span>
                                <span className="text-sm font-medium text-gray-400">{option.votes || 0} votes</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleClosePoll(poll._id)}
                              className="text-sm px-3 py-1 bg-yellow-900/30 text-yellow-500 border border-yellow-900 rounded hover:bg-yellow-900/50"
                            >
                              Close
                            </button>
                            <button
                              onClick={() => handleDeletePoll(poll._id)}
                              className="text-sm px-3 py-1 bg-red-900/30 text-red-500 border border-red-900 rounded hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Event Settings</h3>
            <p className="text-gray-400 mb-6">
              Update event settings including access type, budget, capacity, date, time, and venue.
            </p>

            {settingsError && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4">{settingsError}</div>}
            {settingsSuccess && <div className="bg-green-900/20 text-green-400 p-3 rounded mb-4">{settingsSuccess}</div>}

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Access Type</label>
                  <select
                    value={settingsForm.accessType}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accessType: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">Event Status</label>
                  <select
                    value={settingsForm.status}
                    onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Event Date</label>
                  <input
                    type="date"
                    value={settingsForm.date}
                    onChange={(e) => setSettingsForm({ ...settingsForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Event Time</label>
                  <input
                    type="time"
                    value={settingsForm.time}
                    onChange={(e) => setSettingsForm({ ...settingsForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Venue</label>
                  <input
                    type="text"
                    value={settingsForm.venue}
                    onChange={(e) => setSettingsForm({ ...settingsForm, venue: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event venue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Total Budget (₹)</label>
                  <input
                    type="number"
                    value={settingsForm.budget}
                    onChange={(e) => setSettingsForm({ ...settingsForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current spent: ₹{dashboard.budget?.spent || 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Capacity</label>
                  <input
                    type="number"
                    value={settingsForm.capacity}
                    onChange={(e) => setSettingsForm({ ...settingsForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Currently registered: {dashboard.attendees?.registered || 0}
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">Event Description</label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  placeholder="Enter a detailed description of the event"
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg h-24 resize-none text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">Custom Invite Message</label>
                <textarea
                  value={settingsForm.inviteMessage || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, inviteMessage: e.target.value })}
                  placeholder="Enter a custom message for event invites (optional)"
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg h-24 resize-none text-white placeholder-gray-500"
                />
                <p className="text-sm text-gray-500 mt-1">Leave empty to use default invite message</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Upload MP4 Video</label>
                  <input
                    type="file"
                    accept=".mp4"
                    onChange={(e) => handleMediaFileChange(e, "mp4Video")}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {mediaFiles.mp4Video && (
                    <p className="text-sm text-green-400 mt-1">Selected: {mediaFiles.mp4Video.name}</p>
                  )}
                  {event?.mp4Video && !mediaFiles.mp4Video && (
                    <p className="text-sm text-blue-400 mt-1">Current: {event.mp4Video}</p>
                  )}
                  <label className="block text-sm font-medium text-gray-400 mt-4 mb-2">Or paste MP4 video URL</label>
                  <input
                    type="url"
                    value={settingsForm.mp4VideoUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mp4VideoUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {settingsForm.mp4VideoUrl && (
                    <p className="text-sm text-blue-400 mt-1">Video URL set: {settingsForm.mp4VideoUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Upload M4 Audio</label>
                  <input
                    type="file"
                    accept=".m4a,.m4b"
                    onChange={(e) => handleMediaFileChange(e, "m4Audio")}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {mediaFiles.m4Audio && (
                    <p className="text-sm text-green-400 mt-1">Selected: {mediaFiles.m4Audio.name}</p>
                  )}
                  {event?.m4Audio && !mediaFiles.m4Audio && (
                    <p className="text-sm text-blue-400 mt-1">Current: {event.m4Audio}</p>
                  )}
                  <label className="block text-sm font-medium text-gray-400 mt-4 mb-2">Or paste M4 audio URL</label>
                  <input
                    type="url"
                    value={settingsForm.m4AudioUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, m4AudioUrl: e.target.value })}
                    placeholder="https://example.com/audio.m4a"
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {settingsForm.m4AudioUrl && (
                    <p className="text-sm text-blue-400 mt-1">Audio URL set: {settingsForm.m4AudioUrl}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h4 className="text-lg font-semibold mb-4 text-white">Generate Invite</h4>
                <p className="text-sm text-gray-400 mb-4">Generate and view invite codes for this event</p>
                <button
                  type="button"
                  onClick={handleGenerateInvite}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-4"
                >
                  View/Generate Invite Codes
                </button>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-black border border-zinc-700 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-2">Event Code</p>
                    <p className="text-lg font-mono font-bold text-purple-400">{event?.eventCode}</p>
                  </div>
                  <div className="bg-black border border-zinc-700 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-2">Organizer PIN</p>
                    <p className="text-lg font-mono font-bold text-blue-400">{event?.organizerPIN}</p>
                  </div>
                  <div className="bg-black border border-zinc-700 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-2">Attendee PIN</p>
                    <p className="text-lg font-mono font-bold text-green-400">{event?.attendeePIN}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {settingsLoading ? "Updating..." : "Update Settings"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
