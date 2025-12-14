const Notification = require("../models/Notification")
const Event = require("../models/Event")
const Registration = require("../models/Registration")

exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, sendToAll } = req.body
    const eventId = req.params.eventId

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    const isOrganizer = event.organizer.toString() === req.user.id
    const isCollaborator = event.collaborators.some((c) => c.userId.toString() === req.user.id)

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to send notifications" })
    }

    // Get all registered attendees
    let recipients = []
    if (sendToAll) {
      const registrations = await Registration.find({ event: eventId, status: "registered" })
      recipients = registrations.map((r) => r.user)
    } else if (req.body.recipients) {
      recipients = req.body.recipients
    }

    const notification = new Notification({
      event: eventId,
      recipients,
      title,
      message,
      type: type || "event",
      sentBy: req.user.id,
    })

    await notification.save()

    res.status(201).json({
      success: true,
      notification,
    })
  } catch (error) {
    next(error)
  }
}

exports.getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipients: req.user.id,
    })
      .populate("event", "title eventCode")
      .populate("sentBy", "name")
      .sort({ sentAt: -1 })
      .limit(50)

    // Mark which ones user has read
    const notificationsWithReadStatus = notifications.map((notif) => ({
      ...notif.toObject(),
      isRead: notif.readBy.some((r) => r.userId.toString() === req.user.id),
    }))

    res.json({
      success: true,
      notifications: notificationsWithReadStatus,
    })
  } catch (error) {
    next(error)
  }
}

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" })
    }

    // Check if already read
    const alreadyRead = notification.readBy.some((r) => r.userId.toString() === req.user.id)

    if (!alreadyRead) {
      notification.readBy.push({ userId: req.user.id })
      await notification.save()
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    next(error)
  }
}
