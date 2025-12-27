"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { eventsAPI } from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { formatDate } from "../utils/dateUtils"

export default function BudgetAnalysisDashboard() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [budget, setBudget] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "venue" })
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "" })
  const [budgetTotal, setBudgetTotal] = useState("")
  const [accessEmail, setAccessEmail] = useState("")
  const [accessPermission, setAccessPermission] = useState("view")

  useEffect(() => {
    fetchData()
  }, [eventId])

  const fetchData = async () => {
    try {
      const eventRes = await eventsAPI.getEventById(eventId)
      setEvent(eventRes.data.event)

      const budgetRes = await eventsAPI.getEventBudget(eventId)
      setBudget(budgetRes.data.budget)
      setBudgetTotal(budgetRes.data.budget.total)

      const tasksRes = await eventsAPI.getEventTasks(eventId)
      setTasks(tasksRes.data.tasks)
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    try {
      const res = await eventsAPI.addExpense(eventId, expenseForm)
      setBudget(res.data.budget)
      setExpenseForm({ description: "", amount: "", category: "venue" })
    } catch (err) {
      console.error("Failed to add expense", err)
    }
  }

  const handleUpdateBudgetTotal = async (e) => {
    e.preventDefault()
    try {
      const res = await eventsAPI.updateBudgetTotal(eventId, { total: budgetTotal })
      setBudget(res.data.budget)
    } catch (err) {
      console.error("Failed to update budget", err)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    try {
      const res = await eventsAPI.addTask(eventId, taskForm)
      setTasks(res.data.tasks)
      setTaskForm({ title: "", description: "", dueDate: "" })
    } catch (err) {
      console.error("Failed to add task", err)
    }
  }

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const res = await eventsAPI.updateTaskStatus(eventId, taskId, { status })
      setTasks(res.data.tasks)
    } catch (err) {
      console.error("Failed to update task", err)
    }
  }

  const handleGrantAccess = async (e) => {
    e.preventDefault()
    try {
      await eventsAPI.grantAccess(eventId, { email: accessEmail, permission: accessPermission })
      setAccessEmail("")
      setAccessPermission("view")
      fetchData()
    } catch (err) {
      console.error("Failed to grant access", err)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user || (event && event.organizer._id !== user.id && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to view this budget analysis</p>
          <button
            onClick={() => navigate("/events")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const budgetRemaining = budget ? budget.total - budget.spent : 0
  const budgetPercentage = budget && budget.total > 0 ? (budget.spent / budget.total) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate(`/events/${eventId}`)} className="text-blue-600 hover:text-blue-800 mb-4">
            ← Back to Event
          </button>
          <h1 className="text-4xl font-bold text-gray-900">{event?.title} - Budget & Tasks</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Budget</p>
            <p className="text-3xl font-bold text-blue-600">${budget?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Amount Spent</p>
            <p className="text-3xl font-bold text-red-600">${budget?.spent || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Remaining Budget</p>
            <p className={`text-3xl font-bold ${budgetRemaining >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${budgetRemaining}
            </p>
          </div>
        </div>

        {budget && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Overview</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{budgetPercentage.toFixed(1)}% of budget used</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget Management</h2>

            <form onSubmit={handleUpdateBudgetTotal} className="mb-8 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Total Budget</h3>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(e.target.value)}
                  placeholder="Budget total"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Update
                </button>
              </div>
            </form>

            <form onSubmit={handleAddExpense}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Expense</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Expense description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="Amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="venue">Venue</option>
                  <option value="catering">Catering</option>
                  <option value="equipment">Equipment</option>
                  <option value="staff">Staff</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Add Expense
                </button>
              </div>
            </form>

            {budget?.expenses && budget.expenses.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Expenses</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {budget.expenses.map((expense, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold text-gray-800">{expense.description}</p>
                        <p className="text-xs text-gray-500">{expense.category}</p>
                      </div>
                      <p className="font-bold text-gray-900">${expense.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Task Management</h2>

            <form onSubmit={handleAddTask} className="mb-8 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Task</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Add Task
                </button>
              </div>
            </form>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks ({tasks.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-gray-800">{task.title}</p>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}
                    {task.dueDate && <p className="text-xs text-gray-500">Due: {formatDate(task.dueDate)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {event?.organizer._id === user.id && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Grant Access to Team Members</h2>
            <form onSubmit={handleGrantAccess} className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="email"
                  value={accessEmail}
                  onChange={(e) => setAccessEmail(e.target.value)}
                  placeholder="Team member email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={accessPermission}
                  onChange={(e) => setAccessPermission(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="view">View Only</option>
                  <option value="edit">Edit</option>
                  <option value="manage">Manage</option>
                </select>
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
