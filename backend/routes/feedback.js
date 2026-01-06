const express = require("express")
const { submitFeedback, getEventFeedback } = require("../controllers/feedbackController")
const { auth } = require("../middleware/auth")

const router = express.Router()

router.post("/:eventId", auth, submitFeedback)
router.get("/:eventId", auth, getEventFeedback)

module.exports = router
