const express = require("express")
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  verifyPINAndGetEvent,
  addCollaborator,
  addTask,
  updateTaskStatus,
  getDashboard,
  generateInviteMessage,
  markAttendance,
  getEventRegistrations, // Add new import
} = require("../controllers/eventController")
const {
  getEventBudget,
  addExpense,
  updateBudgetTotal,
  updateBudgetSpent, // Add new import
  updateBudgetIncome, // Add new import
  grantAccess,
  getEventTasks,
} = require("../controllers/budgetController")
const { auth, optionalAuth, authorize } = require("../middleware/auth")
const upload = require("../middleware/multer")

const router = express.Router()

router.get("/organizer/my-events", auth, authorize("organizer", "admin"), getOrganizerEvents)
router.post("/verify-pin", auth, verifyPINAndGetEvent)

router.get("/", getEvents)
router.get("/:id", optionalAuth, getEventById)
router.post("/", auth, authorize("organizer", "admin"), upload.single("image"), createEvent)
router.put("/:id", auth, authorize("organizer", "admin"), upload.single("image"), updateEvent)
router.delete("/:id", auth, authorize("organizer", "admin"), deleteEvent)

router.post("/:id/collaborators", auth, authorize("organizer", "admin"), addCollaborator)
router.post("/:id/tasks", auth, addTask)
router.put("/:id/tasks/:taskId", auth, updateTaskStatus)
router.get("/:id/dashboard", auth, getDashboard)
router.post("/:id/invite", auth, generateInviteMessage)
router.post("/:id/attendance", auth, markAttendance)
router.get("/:id/registrations", auth, getEventRegistrations)

// Budget and task routes (existing)
router.get("/:eventId/budget", auth, getEventBudget)
router.post("/:eventId/budget/expense", auth, addExpense)
router.put("/:eventId/budget/total", auth, updateBudgetTotal)
router.put("/:eventId/budget/spent", auth, updateBudgetSpent)
router.put("/:eventId/budget/income", auth, updateBudgetIncome)
router.get("/:eventId/tasks", auth, getEventTasks)
router.post("/:eventId/access", auth, grantAccess)

module.exports = router
