const express = require("express")
const {
  createPoll,
  getEventPolls,
  getPollById,
  submitPollResponse,
  updatePollStatus,
  deletePoll,
  getPollResults,
} = require("../controllers/pollController")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

router.use((req, res, next) => {
  console.log("[POLLS ROUTER] Incoming request:", req.method, req.path)
  next()
})

router.post("/event/:eventId", auth, authorize("organizer", "admin"), (req, res, next) => {
  console.log("[POLLS ROUTER] POST /event/:eventId matched, eventId:", req.params.eventId)
  createPoll(req, res, next)
})

router.get("/event/:eventId", auth, (req, res, next) => {
  console.log("[POLLS ROUTER] GET /event/:eventId matched, eventId:", req.params.eventId)
  try {
    getEventPolls(req, res, next)
  } catch (err) {
    console.error("[POLLS ROUTER] Error in getEventPolls:", err)
    next(err)
  }
})

router.get("/:pollId/results", auth, (req, res, next) => {
  console.log("[POLLS ROUTER] GET /:pollId/results matched, pollId:", req.params.pollId)
  getPollResults(req, res, next)
})

router.post("/:pollId/respond", auth, (req, res, next) => {
  console.log("[POLLS ROUTER] POST /:pollId/respond matched, pollId:", req.params.pollId)
  submitPollResponse(req, res, next)
})

router.put("/:pollId/status", auth, (req, res, next) => {
  console.log("[POLLS ROUTER] PUT /:pollId/status matched, pollId:", req.params.pollId)
  updatePollStatus(req, res, next)
})

router.delete("/:pollId", auth, (req, res, next) => {
  console.log("[POLLS ROUTER] DELETE /:pollId matched, pollId:", req.params.pollId)
  deletePoll(req, res, next)
})

router.get("/:pollId", auth, (req, res, next) => {
  console.log("[POLLS ROUTER] GET /:pollId matched, pollId:", req.params.pollId)
  getPollById(req, res, next)
})

module.exports = router
