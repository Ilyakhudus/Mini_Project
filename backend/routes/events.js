const express = require("express")
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
} = require("../controllers/eventController")
const {
  getEventBudget,
  addExpense,
  updateBudgetTotal,
  addTask,
  updateTaskStatus,
  grantAccess,
  getEventTasks,
} = require("../controllers/budgetController")
const { auth, authorize } = require("../middleware/auth")
const upload = require("../middleware/multer")

const router = express.Router()

router.get("/", getEvents)
router.get("/:id", getEventById)
router.post("/", auth, authorize("organizer", "admin"), upload.single("image"), createEvent)
router.put("/:id", auth, authorize("organizer", "admin"), upload.single("image"), updateEvent)
router.delete("/:id", auth, authorize("organizer", "admin"), deleteEvent)
router.get("/organizer/my-events", auth, authorize("organizer", "admin"), getOrganizerEvents)

// Budget and task routes
router.get("/:eventId/budget", auth, getEventBudget)
router.post("/:eventId/budget/expense", auth, addExpense)
router.put("/:eventId/budget/total", auth, updateBudgetTotal)
router.get("/:eventId/tasks", auth, getEventTasks)
router.post("/:eventId/tasks", auth, addTask)
router.put("/:eventId/tasks/:taskId", auth, updateTaskStatus)
router.post("/:eventId/access", auth, grantAccess)

module.exports = router
