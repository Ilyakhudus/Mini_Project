const Activity = require("../models/Activity")
const Event = require("../models/Event")

exports.createActivity = async (req, res, next) => {
  try {
    const { title, description, time, venue, duration } = req.body
    const eventId = req.params.eventId

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators?.some((c) => c.userId?.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to create activities" })
    }

    const activity = new Activity({
      event: eventId,
      title,
      description,
      time,
      venue,
      duration,
    })

    await activity.save()

    res.status(201).json({
      success: true,
      activity,
    })
  } catch (error) {
    next(error)
  }
}

exports.getActivitiesByEvent = async (req, res, next) => {
  try {
    const activities = await Activity.find({ event: req.params.eventId }).sort({ time: 1 })

    res.json({
      success: true,
      activities,
    })
  } catch (error) {
    next(error)
  }
}

exports.updateActivity = async (req, res, next) => {
  try {
    const { title, description, time, venue, duration } = req.body
    const activity = await Activity.findById(req.params.id)

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" })
    }

    const event = await Event.findById(activity.event)
    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators?.some((c) => c.userId?.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to update activities" })
    }

    if (title) activity.title = title
    if (description) activity.description = description
    if (time) activity.time = time
    if (venue) activity.venue = venue
    if (duration) activity.duration = duration

    await activity.save()

    res.json({
      success: true,
      activity,
    })
  } catch (error) {
    next(error)
  }
}

exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" })
    }

    const event = await Event.findById(activity.event)
    const isOrganizer = event.organizer.toString() === req.user.id

    if (!isOrganizer) {
      return res.status(403).json({ error: "Only organizer can delete activities" })
    }

    await Activity.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Activity deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
