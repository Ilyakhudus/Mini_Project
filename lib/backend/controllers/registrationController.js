const Registration = require("../models/Registration")
const Event = require("../models/Event")

exports.registerEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ error: "Event capacity full" })
    }

    let registration = await Registration.findOne({
      user: req.user.id,
      event: eventId,
    })

    if (registration) {
      return res.status(400).json({ error: "Already registered for this event" })
    }

    registration = new Registration({
      user: req.user.id,
      event: eventId,
      status: "registered",
    })

    await registration.save()
    event.registeredCount += 1
    await event.save()

    await registration.populate("event", "title date venue")

    res.status(201).json({
      success: true,
      registration,
    })
  } catch (error) {
    next(error)
  }
}

exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" })
    }

    if (registration.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" })
    }

    const event = await Event.findById(registration.event)
    event.registeredCount = Math.max(0, event.registeredCount - 1)
    await event.save()

    await Registration.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Registration cancelled",
    })
  } catch (error) {
    next(error)
  }
}

exports.getUserRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const registrations = await Registration.find({ user: req.user.id })
      .populate("event", "title date venue price image")
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Registration.countDocuments({ user: req.user.id })

    res.json({
      success: true,
      registrations,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalEvents = await Event.countDocuments()
    const totalUsers = require("../models/User").countDocuments()
    const totalRegistrations = await Registration.countDocuments()

    const organizerEvents = await Event.countDocuments({ organizer: req.user.id })
    const userRegistrations = await Registration.countDocuments({ user: req.user.id })

    res.json({
      success: true,
      stats: {
        totalEvents,
        totalRegistrations,
        organizerEvents,
        userRegistrations,
      },
    })
  } catch (error) {
    next(error)
  }
}
