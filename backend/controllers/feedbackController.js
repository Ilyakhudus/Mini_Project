const Feedback = require("../models/Feedback")
const Event = require("../models/Event")
const Registration = require("../models/Registration")

exports.submitFeedback = async (req, res, next) => {
  try {
    const { sentiment, comment, rating } = req.body
    const eventId = req.params.eventId

    // Check if user is registered for this event
    const registration = await Registration.findOne({
      event: eventId,
      user: req.user.id,
      status: "registered",
    })

    if (!registration) {
      return res.status(403).json({ error: "You must be registered to provide feedback" })
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: req.user.id,
    })

    if (existingFeedback) {
      existingFeedback.sentiment = sentiment
      existingFeedback.comment = comment
      existingFeedback.rating = rating
      await existingFeedback.save()

      return res.json({
        success: true,
        feedback: existingFeedback,
      })
    }

    const feedback = new Feedback({
      event: eventId,
      user: req.user.id,
      sentiment,
      comment,
      rating,
    })

    await feedback.save()

    res.status(201).json({
      success: true,
      feedback,
    })
  } catch (error) {
    next(error)
  }
}

exports.getEventFeedback = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to view feedback" })
    }

    const feedbacks = await Feedback.find({ event: req.params.eventId }).populate("user", "name email")

    res.json({
      success: true,
      feedbacks,
    })
  } catch (error) {
    next(error)
  }
}
