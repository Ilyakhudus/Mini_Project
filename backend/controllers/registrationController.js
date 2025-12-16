const Registration = require("../models/Registration")
const Event = require("../models/Event")

exports.registerEvent = async (req, res, next) => {
  try {
    const { eventId, pin } = req.body

    console.log("[v0] registerEvent called with:", { eventId, pin: pin ? "***" : null, userId: req.user.id })

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      console.log("[v0] Event not found:", eventId)
      return res.status(404).json({ error: "Event not found" })
    }

    console.log("[v0] Event found:", {
      title: event.title,
      accessType: event.accessType,
      attendeePIN: event.attendeePIN,
    })

    if (event.accessType === "invite-only") {
      if (!pin) {
        console.log("[v0] PIN required but not provided")
        return res.status(400).json({ error: "PIN is required for invite-only events" })
      }
      if (pin !== event.attendeePIN) {
        console.log("[v0] Invalid PIN provided:", { provided: pin, expected: event.attendeePIN })
        return res.status(401).json({ error: "Invalid PIN" })
      }
      console.log("[v0] PIN verified successfully")
    }

    if (event.registeredCount >= event.capacity) {
      console.log("[v0] Event at capacity:", { registeredCount: event.registeredCount, capacity: event.capacity })
      return res.status(400).json({ error: "Event capacity full" })
    }

    const existingRegistration = await Registration.findOne({
      user: req.user.id,
      event: eventId,
    })

    console.log("[v0] Existing registration check:", existingRegistration ? "Found" : "Not found")

    if (existingRegistration) {
      if (existingRegistration.status === "cancelled") {
        console.log("[v0] Reactivating cancelled registration")
        existingRegistration.status = "registered"
        existingRegistration.usedPIN = event.accessType === "invite-only"
        existingRegistration.registeredAt = Date.now()
        await existingRegistration.save()

        event.registeredCount += 1
        await event.save()

        await existingRegistration.populate("event", "title date time venue price image eventCode eventType area")

        return res.status(200).json({
          success: true,
          registration: existingRegistration,
          message: "Registration reactivated successfully",
        })
      }

      console.log("[v0] User already registered for this event")
      return res.status(400).json({ error: "Already registered for this event" })
    }

    const registration = new Registration({
      user: req.user.id,
      event: eventId,
      status: "registered",
      usedPIN: event.accessType === "invite-only",
    })

    console.log("[v0] Creating new registration:", registration)

    await registration.save()

    event.registeredCount = (event.registeredCount || 0) + 1
    await event.save()

    console.log("[v0] Registration saved, updating event count to:", event.registeredCount)

    await registration.populate("event", "title date time venue price image eventCode eventType area")

    console.log("[v0] Registration complete:", registration._id)

    res.status(201).json({
      success: true,
      registration,
    })
  } catch (error) {
    console.error("[v0] Error in registerEvent:", error)
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

    console.log("[v0] getUserRegistrations called for user:", req.user.id)

    const registrations = await Registration.find({ user: req.user.id, status: "registered" })
      .populate("event", "title date time venue price image eventCode eventType area")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ registeredAt: -1 })

    console.log("[v0] Found registrations:", registrations.length)

    const validRegistrations = registrations.filter((reg) => reg.event !== null)
    console.log("[v0] Valid registrations (with event data):", validRegistrations.length)

    const total = await Registration.countDocuments({ user: req.user.id, status: "registered" })

    res.json({
      success: true,
      registrations: validRegistrations,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Error in getUserRegistrations:", error)
    next(error)
  }
}

exports.getUserInvitations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    console.log("[v0] getUserInvitations called for user:", req.user.id)

    // Find registrations where the user registered for invite-only events
    const registrations = await Registration.find({
      user: req.user.id,
      status: "registered",
      usedPIN: true, // Only events that required a PIN (invite-only)
    })
      .populate("event", "title date time venue price image eventCode eventType area accessType description")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ "event.date": 1 })

    console.log("[v0] Found registrations with usedPIN:", registrations.length)

    // Filter to only include invite-only events
    const invitations = registrations.filter((reg) => reg.event && reg.event.accessType === "invite-only")

    console.log("[v0] Filtered invite-only events:", invitations.length)

    const total = invitations.length

    res.json({
      success: true,
      invitations,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Error in getUserInvitations:", error)
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
