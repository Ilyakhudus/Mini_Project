const express = require("express")
const { 
  sendMessage, 
  getUserMessages, 
  markAsRead, 
  getEventMessages,
  votePoll 
} = require("../controllers/messageController")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Attendee routes
router.get("/", auth, getUserMessages)
router.put("/:messageId/read", auth, markAsRead)
router.post("/:messageId/vote", auth, votePoll)

// Organizer routes
router.post("/event/:eventId", auth, sendMessage)
router.get("/event/:eventId", auth, getEventMessages)

module.exports = router
