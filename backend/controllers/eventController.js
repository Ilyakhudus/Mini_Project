const Event = require("../models/Event")
const Registration = require("../models/Registration")
const Attendance = require("../models/Attendance")
const Feedback = require("../models/Feedback")
const Poll = require("../models/Polls") // Added Poll model import

exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      detailedDescription,
      activitiesAndBenefits,
      date,
      time,
      venue,
      price,
      capacity,
      category,
      eventType,
      area,
      accessType,
      images,
      videos,
      budget,
    } = req.body

    if (!title || !date || !time || !venue || !eventType || !area) {
      return res.status(400).json({ error: "Please provide all required fields" })
    }

    const event = new Event({
      title,
      description,
      detailedDescription,
      activitiesAndBenefits,
      date,
      time,
      venue,
      price: price || 0,
      capacity: capacity || 100,
      category,
      eventType,
      area,
      accessType: accessType || "open",
      images: images || [],
      videos: videos || [],
      organizer: req.user.id,
      image: req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null,
      mp4Video: req.files?.mp4Video?.[0] ? `/uploads/${req.files.mp4Video[0].filename}` : req.body.mp4VideoUrl || null,
      m4Audio: req.files?.m4Audio?.[0] ? `/uploads/${req.files.m4Audio[0].filename}` : req.body.m4AudioUrl || null,
      budget: {
        total: budget || 0,
        spent: 0,
        expenses: [],
      },
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
    const { page = 1, limit = 10, search, category, eventType, area, accessType, eventCode } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (search) {
      query.title = { $regex: search, $options: "i" }
    }
    if (category) {
      query.category = category
    }
    if (eventType) {
      query.eventType = eventType
    }
    if (area) {
      query.area = { $regex: area, $options: "i" }
    }
    if (accessType) {
      query.accessType = accessType
    }
    if (eventCode) {
      query.eventCode = eventCode.toUpperCase()
    }

    const events = await Event.find(query)
      .populate("organizer", "name email")
      .select("-organizerPIN -attendeePIN") // Don't expose PINs in list view
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ date: 1 })

    const eventsWithSyncedCounts = await Promise.all(
      events.map(async (event) => {
        const actualRegisteredCount = await Registration.countDocuments({ event: event._id, status: "registered" })
        event.registeredCount = actualRegisteredCount
        return event
      }),
    )

    const total = await Event.countDocuments(query)

    res.json({
      success: true,
      events: eventsWithSyncedCounts,
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
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate({ path: "collaborators.userId", select: "name email", options: { strictPopulate: false } })
      .populate({ path: "tasks.assignedTo", select: "name email", options: { strictPopulate: false } })

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const actualRegisteredCount = await Registration.countDocuments({ event: event._id, status: "registered" })
    event.registeredCount = actualRegisteredCount
    await event.save()

    const isOrganizer = req.user && event.organizer._id.toString() === req.user.id
    const isCollaborator =
      req.user &&
      event.collaborators &&
      event.collaborators.some((c) => c.userId && c.userId._id && c.userId._id.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      event.organizerPIN = undefined
      event.attendeePIN = undefined
    }

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyPINAndGetEvent = async (req, res, next) => {
  try {
    const { eventId, pin, userType } = req.body

    if (!pin || !userType) {
      return res.status(400).json({ error: "Please provide PIN and user type" })
    }

    const event = await Event.findById(eventId).populate("organizer", "name email")

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Verify PIN based on user type
    const isValid =
      (userType === "attendee" && event.attendeePIN === pin) || (userType === "organizer" && event.organizerPIN === pin)

    if (!isValid) {
      return res.status(401).json({ error: "Invalid PIN" })
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

    const {
      title,
      description,
      detailedDescription,
      activitiesAndBenefits,
      date,
      time,
      venue,
      price,
      capacity,
      category,
      status,
      eventType,
      area,
      accessType,
      images,
      videos,
      budget,
      inviteMessage,
    } = req.body

    if (title !== undefined && (!title || title.trim() === "")) {
      return res.status(400).json({ error: "Event title cannot be empty" })
    }

    if (date !== undefined && date !== "") {
      try {
        if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const dateObj = new Date(date + "T00:00:00Z")
          if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: "Invalid date format" })
          }
          event.date = dateObj
        } else {
          return res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD" })
        }
      } catch (e) {
        return res.status(400).json({ error: "Invalid date format" })
      }
    }

    if (title !== undefined) event.title = title.trim()
    if (description !== undefined) event.description = description // Added description update
    if (detailedDescription !== undefined) event.detailedDescription = detailedDescription
    if (activitiesAndBenefits !== undefined) event.activitiesAndBenefits = activitiesAndBenefits
    if (time !== undefined) event.time = time
    if (venue !== undefined) event.venue = venue.trim()
    if (price !== undefined) event.price = Number(price) || 0
    if (capacity !== undefined) event.capacity = Number(capacity) || 100
    if (category !== undefined) event.category = category
    if (status !== undefined) event.status = status
    if (eventType !== undefined) event.eventType = eventType
    if (area !== undefined) event.area = area
    if (accessType !== undefined) event.accessType = accessType
    if (images !== undefined) event.images = images
    if (videos !== undefined) event.videos = videos
    if (inviteMessage !== undefined) event.inviteMessage = inviteMessage

    if (req.files?.image?.[0]) {
      event.image = `/uploads/${req.files.image[0].filename}`
    }
    if (req.files?.mp4Video?.[0]) {
      event.mp4Video = `/uploads/${req.files.mp4Video[0].filename}`
    } else if (req.body.mp4VideoUrl) {
      event.mp4Video = req.body.mp4VideoUrl
    }

    if (req.files?.m4Audio?.[0]) {
      event.m4Audio = `/uploads/${req.files.m4Audio[0].filename}`
    } else if (req.body.m4AudioUrl) {
      event.m4Audio = req.body.m4AudioUrl
    }

    if (budget !== undefined) {
      event.budget.total = Number(budget) || 0
      if (!event.budget.spent) event.budget.spent = 0
      if (!event.budget.income) event.budget.income = 0
      if (!event.budget.expenses) event.budget.expenses = []
    }

    event.updatedAt = new Date()
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

    const events = await Event.find({
      $or: [{ organizer: req.user.id }, { "collaborators.userId": req.user.id }],
    })
      .populate("organizer", "name email")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ date: -1 })

    const eventsWithSyncedCounts = await Promise.all(
      events.map(async (event) => {
        const actualRegisteredCount = await Registration.countDocuments({ event: event._id, status: "registered" })
        event.registeredCount = actualRegisteredCount
        return event
      }),
    )

    const total = await Event.countDocuments({
      $or: [{ organizer: req.user.id }, { "collaborators.userId": req.user.id }],
    })

    res.json({
      success: true,
      events: eventsWithSyncedCounts,
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

exports.addCollaborator = async (req, res, next) => {
  try {
    const { userId } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only organizer can add collaborators" })
    }

    // Check if already a collaborator
    if (event.collaborators.some((c) => c.userId.toString() === userId)) {
      return res.status(400).json({ error: "User is already a collaborator" })
    }

    event.collaborators.push({ userId })
    await event.save()
    await event.populate("collaborators.userId", "name email")

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    next(error)
  }
}

exports.addTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, budget, deadline } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to add tasks" })
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Task title is required" })
    }

    event.tasks.push({
      title: title.trim(),
      description: description || "",
      assignedTo: assignedTo || null,
      budget: budget ? Number(budget) : 0,
      deadline: deadline || null,
    })

    await event.save()
    await event.populate("tasks.assignedTo", "name email")

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    next(error)
  }
}

exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id, taskId } = req.params
    const { status, spent } = req.body

    const event = await Event.findById(id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const task = event.tasks.id(taskId)

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user.id

    if (!isOrganizer && !isCollaborator && !isAssigned) {
      return res.status(403).json({ error: "Not authorized to update this task" })
    }

    const wasNotCompleted = task.status !== "completed"
    const isNowCompleted = status === "completed"

    if (status) task.status = status
    if (spent !== undefined) task.spent = spent
    if (status === "completed") task.completedAt = Date.now()

    if (wasNotCompleted && isNowCompleted && task.budget > 0) {
      event.budget.spent = (event.budget.spent || 0) + task.budget
      event.budget.expenses.push({
        description: `Task completed: ${task.title}`,
        amount: task.budget,
        category: "task",
        taskId: task._id,
        date: new Date(),
      })
    }

    await event.save()

    res.json({
      success: true,
      task,
      budget: event.budget,
    })
  } catch (error) {
    next(error)
  }
}

exports.getDashboard = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate({ path: "collaborators.userId", select: "name email", options: { strictPopulate: false } })
      .populate({ path: "tasks.assignedTo", select: "name email", options: { strictPopulate: false } })

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer._id.toString() === req.user.id
    const isCollaborator =
      event.collaborators &&
      event.collaborators.some((c) => c.userId && c.userId._id && c.userId._id.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to view dashboard" })
    }

    const totalTasks = event.tasks ? event.tasks.length : 0
    const completedTasks = event.tasks ? event.tasks.filter((t) => t.status === "completed").length : 0
    const pendingTasks = event.tasks ? event.tasks.filter((t) => t.status === "pending").length : 0

    const collaboratorStats = {}
    if (event.tasks) {
      event.tasks.forEach((task) => {
        if (task.assignedTo && task.assignedTo._id) {
          const userId = task.assignedTo._id.toString()
          if (!collaboratorStats[userId]) {
            collaboratorStats[userId] = {
              user: task.assignedTo,
              total: 0,
              completed: 0,
              pending: 0,
            }
          }
          collaboratorStats[userId].total++
          if (task.status === "completed") collaboratorStats[userId].completed++
          if (task.status === "pending") collaboratorStats[userId].pending++
        }
      })
    }

    const totalBudget = event.tasks ? event.tasks.reduce((sum, task) => sum + (task.budget || 0), 0) : 0
    const totalSpent = event.tasks ? event.tasks.reduce((sum, task) => sum + (task.spent || 0), 0) : 0
    const budgetRemaining = totalBudget - totalSpent

    const registeredCount = await Registration.countDocuments({ event: event._id, status: "registered" })
    const attendingCount = await Attendance.countDocuments({ event: event._id })

    const feedbacks = await Feedback.find({ event: event._id })
    const feedbackStats = {
      positive: feedbacks.filter((f) => f.sentiment === "positive").length,
      neutral: feedbacks.filter((f) => f.sentiment === "neutral").length,
      negative: feedbacks.filter((f) => f.sentiment === "negative").length,
      total: feedbacks.length,
    }

    const polls = await Poll.find({ eventId: event._id })
    const pollStats = polls.map((poll) => ({
      _id: poll._id,
      question: poll.question,
      totalResponses: poll.responses.length,
      isActive: poll.isActive,
      options: poll.options.map((opt) => ({
        optionText: opt.optionText,
        votes: opt.votes,
        percentage: poll.responses.length > 0 ? ((opt.votes / poll.responses.length) * 100).toFixed(2) : 0,
      })),
    }))

    res.json({
      success: true,
      dashboard: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
        },
        collaborators: Object.values(collaboratorStats),
        budget: {
          projected: totalBudget,
          spent: totalSpent,
          remaining: budgetRemaining,
        },
        attendees: {
          registered: registeredCount,
          attending: attendingCount,
        },
        feedback: feedbackStats,
        polls: pollStats, // Added polls to dashboard response
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.generateInviteMessage = async (req, res, next) => {
  try {
    const { recipientType, customMessage } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator =
      event.collaborators && event.collaborators.some((c) => c.userId && c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Only organizer or collaborators can generate invites" })
    }

    const pin = recipientType === "collaborator" ? event.organizerPIN : event.attendeePIN
    const eventCode = event.eventCode || "N/A"

    const inviteMessage = `${customMessage || `You're invited to ${event.title}!`}

Event Details:
- Event Code: ${eventCode}
- Date: ${new Date(event.date).toLocaleDateString()}
- Time: ${event.time}
- Venue: ${event.venue}
- Access Type: ${event.accessType === "invite-only" ? "Invite Only" : "Open"}

Your Registration PIN: ${pin || "N/A"}
(Use this PIN when registering for the event)

${event.price > 0 ? `Price: ₹${event.price}` : "This is a free event!"}
`.trim()

    res.json({
      success: true,
      inviteMessage,
    })
  } catch (error) {
    next(error)
  }
}

exports.markAttendance = async (req, res, next) => {
  try {
    const { userId } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to mark attendance" })
    }

    const registration = await Registration.findOne({ event: event._id, user: userId, status: "registered" })
    if (!registration) {
      return res.status(400).json({ error: "User is not registered for this event" })
    }

    const attendance = await Attendance.findOneAndUpdate(
      { event: event._id, user: userId },
      { markedBy: req.user.id },
      { upsert: true, new: true },
    )

    const attendingCount = await Attendance.countDocuments({ event: event._id })
    event.attendingCount = attendingCount
    await event.save()

    res.json({
      success: true,
      attendance,
    })
  } catch (error) {
    next(error)
  }
}

exports.getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator =
      event.collaborators &&
      event.collaborators.some((c) => c.userId && c.userId._id && c.userId._id.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view registrations" })
    }

    const registrations = await Registration.find({ event: event._id, status: "registered" })
      .populate("user", "name email")
      .sort({ registeredAt: -1 })

    const attendanceRecords = await Attendance.find({ event: event._id })
    const attendedUserIds = attendanceRecords.map((a) => a.user.toString())

    const registrationsWithAttendance = registrations.map((reg) => ({
      _id: reg._id,
      user: reg.user,
      registeredAt: reg.registeredAt,
      hasAttended: attendedUserIds.includes(reg.user._id.toString()),
    }))

    res.json({
      success: true,
      registrations: registrationsWithAttendance,
      total: registrations.length,
      attendedCount: attendedUserIds.length,
    })
  } catch (error) {
    console.error("[v0] Error in getEventRegistrations:", error)
    next(error)
  }
}
