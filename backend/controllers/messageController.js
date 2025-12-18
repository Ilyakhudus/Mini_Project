const Message = require("../models/Message")
const Event = require("../models/Event")
const Registration = require("../models/Registration")

// Send message to all registered attendees of an event
exports.sendMessage = async (req, res) => {
  try {
    const { eventId } = req.params
    const { title, content } = req.body

    // Verify event exists and user is organizer
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the organizer can send messages" })
    }

    // Get all registered attendees
    const registrations = await Registration.find({ event: eventId })
    const recipients = registrations.map((reg) => ({
      user: reg.user,
      read: false,
    }))

    if (recipients.length === 0) {
      return res.status(400).json({ error: "No registered attendees to send message to" })
    }

    const message = await Message.create({
      event: eventId,
      sender: req.user._id,
      title,
      content,
      recipients,
    })

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
      recipientCount: recipients.length,
    })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

// Get messages for a user (attendee view)
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user._id

    const messages = await Message.find({
      "recipients.user": userId,
    })
      .populate("event", "title eventCode date time venue")
      .populate("sender", "name")
      .sort({ createdAt: -1 })

    // Format messages with read status
    const formattedMessages = messages.map((msg) => {
      const recipient = msg.recipients.find((r) => r.user.toString() === userId.toString())
      return {
        _id: msg._id,
        event: msg.event,
        sender: msg.sender,
        title: msg.title,
        content: msg.content,
        read: recipient?.read || false,
        readAt: recipient?.readAt,
        createdAt: msg.createdAt,
      }
    })

    res.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Get user messages error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user._id

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        "recipients.user": userId,
      },
      {
        $set: {
          "recipients.$.read": true,
          "recipients.$.readAt": new Date(),
        },
      },
      { new: true },
    )

    if (!message) {
      return res.status(404).json({ error: "Message not found" })
    }

    res.json({ success: true })
  } catch (error) {
    console.error("Mark as read error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

// Get messages sent for an event (organizer view)
exports.getEventMessages = async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the organizer can view event messages" })
    }

    const messages = await Message.find({ event: eventId }).populate("sender", "name").sort({ createdAt: -1 })

    res.json({ messages })
  } catch (error) {
    console.error("Get event messages error:", error)
    res.status(500).json({ error: "Server error" })
  }
}
