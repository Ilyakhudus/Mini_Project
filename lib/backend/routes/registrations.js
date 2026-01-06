const express = require("express")
const {
  registerEvent,
  cancelRegistration,
  getUserRegistrations,
  getDashboardStats,
} = require("../controllers/registrationController")
const { auth } = require("../middleware/auth")

const router = express.Router()

router.post("/", auth, registerEvent)
router.delete("/:id", auth, cancelRegistration)
router.get("/", auth, getUserRegistrations)
router.get("/stats/dashboard", auth, getDashboardStats)

module.exports = router
