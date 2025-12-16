import axios from "axios"

const API_URL = "/api"

const api = axios.create({
  baseURL: API_URL,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
}

export const eventsAPI = {
  getEvents: (
    page = 1,
    limit = 10,
    search = "",
    category = "",
    eventType = "",
    area = "",
    accessType = "",
    eventCode = "",
  ) => api.get("/events", { params: { page, limit, search, category, eventType, area, accessType, eventCode } }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post("/events", data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  getOrganizerEvents: (page = 1, limit = 10) => api.get("/events/organizer/my-events", { params: { page, limit } }),
  getEventBudget: (eventId) => api.get(`/events/${eventId}/budget`),
  addExpense: (eventId, data) => api.post(`/events/${eventId}/budget/expense`, data),
  updateBudgetTotal: (eventId, data) => api.put(`/events/${eventId}/budget/total`, data),
  getEventTasks: (eventId) => api.get(`/events/${eventId}/tasks`),
  addTask: (eventId, data) => api.post(`/events/${eventId}/tasks`, data),
  updateTaskStatus: (eventId, taskId, data) => api.put(`/events/${eventId}/tasks/${taskId}`, data),
  grantAccess: (eventId, data) => api.post(`/events/${eventId}/access`, data),
  verifyPIN: (eventId, pin, userType) => api.post("/events/verify-pin", { eventId, pin, userType }),
  generateInvite: (eventId, recipientType, customMessage) =>
    api.post(`/events/${eventId}/invite`, { recipientType, customMessage }),
  getDashboard: (eventId) => api.get(`/events/${eventId}/dashboard`),
  addCollaborator: (eventId, userId) => api.post(`/events/${eventId}/collaborators`, { userId }),
  markAttendance: (eventId, userId) => api.post(`/events/${eventId}/attendance`, { userId }),
}

export const registrationsAPI = {
  registerEvent: (eventId, pin = null) => api.post("/registrations", { eventId, pin }),
  cancelRegistration: (id) => api.delete(`/registrations/${id}`),
  getUserRegistrations: (page = 1, limit = 10) => api.get("/registrations", { params: { page, limit } }),
  getUserInvitations: (page = 1, limit = 20) => api.get("/registrations/invitations", { params: { page, limit } }),
  getDashboardStats: () => api.get("/registrations/stats/dashboard"),
}

export default api
