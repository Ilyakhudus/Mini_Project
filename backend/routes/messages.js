const express = require("express")
const { sendMessage, getUserMessages, markAsRead, getEventMessages } = require("../controllers/messageController")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Attendee routes
router.get("/", auth, getUserMessages)
router.put("/:messageId/read", auth, markAsRead)

// Organizer routes
router.post("/event/:eventId", auth, sendMessage)
router.get("/event/:eventId", auth, getEventMessages)

module.exports = router
