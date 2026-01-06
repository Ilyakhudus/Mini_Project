const express = require("express")
const {
  registerEvent,
  cancelRegistration,
  getUserRegistrations,
  getDashboardStats,
  getUpcomingEventsWithReminders,
  getUserInvitations, // Added new import
} = require("../controllers/registrationController")
const { auth } = require("../middleware/auth")

const router = express.Router()

router.post("/", auth, registerEvent)
router.delete("/:id", auth, cancelRegistration)
router.get("/", auth, getUserRegistrations)
router.get("/invitations", auth, getUserInvitations) // Added new route for invitations
router.get("/upcoming/reminders", auth, getUpcomingEventsWithReminders)
router.get("/stats/dashboard", auth, getDashboardStats)

module.exports = router
