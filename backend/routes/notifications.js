const express = require("express")
const { sendNotification, getUserNotifications, markAsRead } = require("../controllers/notificationController")
const { auth } = require("../middleware/auth")

const router = express.Router()

router.post("/:eventId", auth, sendNotification)
router.get("/", auth, getUserNotifications)
router.put("/:id/read", auth, markAsRead)

module.exports = router
