const Registration = require("../models/Registration")
const Event = require("../models/Event")

exports.registerEvent = async (req, res, next) => {
  try {
    const { eventId, pin } = req.body

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.accessType === "invite-only") {
      if (!pin) {
        return res.status(400).json({ error: "PIN is required for invite-only events" })
      }
      if (pin !== event.attendeePIN) {
        return res.status(401).json({ error: "Invalid PIN" })
      }
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
      usedPIN: event.accessType === "invite-only",
    })

    await registration.save()
    event.registeredCount += 1
    await event.save()

    await registration.populate("event", "title date venue eventCode eventType area")

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

    const registrations = await Registration.find({ user: req.user.id, status: "registered" })
      .populate("event", "title date time venue price image eventCode eventType area accessType")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ "event.date": 1 })

    const total = await Registration.countDocuments({ user: req.user.id, status: "registered" })

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

exports.getUpcomingEventsWithReminders = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user.id, status: "registered" }).populate(
      "event",
      "title date time venue eventCode",
    )

    const now = new Date()
    const eventsWithReminders = registrations
      .map((reg) => {
        if (!reg.event || !reg.event.date) return null

        const eventDate = new Date(reg.event.date)
        const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24))

        return {
          ...reg.toObject(),
          daysUntil,
          reminder:
            daysUntil === 1 ? "1 day remaining" : daysUntil > 0 ? `${daysUntil} days remaining` : "Event passed",
        }
      })
      .filter((event) => event !== null && event.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)

    res.json({
      success: true,
      events: eventsWithReminders,
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
