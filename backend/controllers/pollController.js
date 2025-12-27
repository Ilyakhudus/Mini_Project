const Poll = require("../models/Polls")
const Event = require("../models/Event")

// Create a new poll
exports.createPoll = async (req, res, next) => {
  try {
    const { eventId, question, description, options } = req.body

    if (!eventId || !question || !options || options.length < 2) {
      return res.status(400).json({
        error: "Please provide event ID, question, and at least 2 options",
      })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only event organizer can create polls" })
    }

    const poll = new Poll({
      eventId,
      question,
      description,
      options: options.map((opt) => ({
        optionText: opt,
        votes: 0,
      })),
      createdBy: req.user.id,
    })

    await poll.save()

    res.status(201).json({
      success: true,
      data: poll,
    })
  } catch (error) {
    next(error)
  }
}

// Get polls for an event
exports.getEventPolls = async (req, res, next) => {
  try {
    const { eventId } = req.params
    console.log("[POLL CONTROLLER] getEventPolls called with eventId:", eventId)

    if (!eventId) {
      console.log("[POLL CONTROLLER] No eventId provided")
      return res.status(400).json({ error: "Event ID is required" })
    }

    const polls = await Poll.find({ eventId }).populate("createdBy", "name email")
    console.log("[POLL CONTROLLER] Found polls:", polls.length)

    res.json({
      success: true,
      data: polls,
    })
  } catch (error) {
    console.error("[POLL CONTROLLER] Error in getEventPolls:", error)
    next(error)
  }
}

// Get a single poll
exports.getPollById = async (req, res, next) => {
  try {
    const { pollId } = req.params
    const poll = await Poll.findById(pollId).populate("createdBy", "name email")

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" })
    }

    res.json({
      success: true,
      data: poll,
    })
  } catch (error) {
    next(error)
  }
}

// Submit a poll response
exports.submitPollResponse = async (req, res, next) => {
  try {
    const { pollId } = req.params
    const { selectedOption } = req.body

    if (selectedOption === undefined || selectedOption === null) {
      return res.status(400).json({ error: "Please select an option" })
    }

    const poll = await Poll.findById(pollId)
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" })
    }

    const existingResponse = poll.responses.find((r) => r.userId.toString() === req.user.id)
    if (existingResponse) {
      return res.status(400).json({ error: "You have already responded to this poll" })
    }

    if (selectedOption < 0 || selectedOption >= poll.options.length) {
      return res.status(400).json({ error: "Invalid option selected" })
    }

    poll.responses.push({
      userId: req.user.id,
      selectedOption,
    })

    poll.options[selectedOption].votes += 1
    await poll.save()

    res.json({
      success: true,
      message: "Poll response recorded",
      data: poll,
    })
  } catch (error) {
    next(error)
  }
}

// Update poll status
exports.updatePollStatus = async (req, res, next) => {
  try {
    const { pollId } = req.params
    const { isActive } = req.body

    const poll = await Poll.findById(pollId)
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" })
    }

    if (poll.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only poll creator can update status" })
    }

    poll.isActive = isActive
    await poll.save()

    res.json({
      success: true,
      message: "Poll status updated",
      data: poll,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a poll
exports.deletePoll = async (req, res, next) => {
  try {
    const { pollId } = req.params

    const poll = await Poll.findById(pollId)
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" })
    }

    if (poll.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only poll creator can delete this poll" })
    }

    await Poll.findByIdAndDelete(pollId)

    res.json({
      success: true,
      message: "Poll deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Get poll results
exports.getPollResults = async (req, res, next) => {
  try {
    const { pollId } = req.params
    const poll = await Poll.findById(pollId)

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" })
    }

    const totalResponses = poll.responses.length
    const results = poll.options.map((opt) => ({
      optionText: opt.optionText,
      votes: opt.votes,
      percentage: totalResponses > 0 ? ((opt.votes / totalResponses) * 100).toFixed(2) : 0,
    }))

    res.json({
      success: true,
      data: {
        question: poll.question,
        totalResponses,
        results,
        isActive: poll.isActive,
      },
    })
  } catch (error) {
    next(error)
  }
}
