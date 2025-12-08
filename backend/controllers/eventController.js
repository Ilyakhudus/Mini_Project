const Event = require("../models/Event")
const Registration = require("../models/Registration")

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, time, venue, price, capacity, category } = req.body

    if (!title || !date || !time || !venue) {
      return res.status(400).json({ error: "Please provide all required fields" })
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      venue,
      price: price || 0,
      capacity: capacity || 100,
      category,
      organizer: req.user.id,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    })

    await event.save()
    await event.populate("organizer", "name email")

    res.status(201).json({
      success: true,
      event,
    })
  } catch (error) {
    next(error)
  }
}

exports.getEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (search) {
      query.title = { $regex: search, $options: "i" }
    }
    if (category) {
      query.category = category
    }

    const events = await Event.find(query)
      .populate("organizer", "name email")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ date: 1 })

    const total = await Event.countDocuments(query)

    res.json({
      success: true,
      events,
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

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email")

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    next(error)
  }
}

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this event" })
    }

    const { title, description, date, time, venue, price, capacity, category, status } = req.body

    if (title) event.title = title
    if (description) event.description = description
    if (date) event.date = date
    if (time) event.time = time
    if (venue) event.venue = venue
    if (price !== undefined) event.price = price
    if (capacity) event.capacity = capacity
    if (category) event.category = category
    if (status) event.status = status
    if (req.file) event.image = `/uploads/${req.file.filename}`

    event.updatedAt = Date.now()
    await event.save()
    await event.populate("organizer", "name email")

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    next(error)
  }
}

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this event" })
    }

    await Event.findByIdAndDelete(req.params.id)
    await Registration.deleteMany({ event: req.params.id })

    res.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

exports.getOrganizerEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const events = await Event.find({ organizer: req.user.id })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ date: -1 })

    const total = await Event.countDocuments({ organizer: req.user.id })

    res.json({
      success: true,
      events,
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
