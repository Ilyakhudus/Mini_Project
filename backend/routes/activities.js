const express = require("express")
const {
  createActivity,
  getActivitiesByEvent,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController")
const { auth } = require("../middleware/auth")

const router = express.Router()

router.post("/:eventId", auth, createActivity)
router.get("/:eventId", getActivitiesByEvent)
router.put("/:id", auth, updateActivity)
router.delete("/:id", auth, deleteActivity)

module.exports = router
