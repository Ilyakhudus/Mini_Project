const Message = require("../models/Message")
const Event = require("../models/Event")
const Registration = require("../models/Registration")

// Send message to all registered attendees of an event
const sendMessage = async (req, res) => {
  try {
    const { eventId } = req.params
    const { title, content, messageType, pollOptions, pollMultiSelect, mediaUrl, mediaType } = req.body

    // Verify event exists and user is organizer
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
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

    const messageData = {
      event: eventId,
      sender: req.user.id,
      title,
      content,
      messageType: messageType || "text",
      recipients,
    }

    if (messageType === "poll" && pollOptions) {
      messageData.pollOptions = pollOptions.map((option) => ({
        text: option,
        votes: [],
      }))
      messageData.pollMultiSelect = pollMultiSelect || false
    }

    if (messageType === "media") {
      messageData.mediaUrl = mediaUrl
      messageData.mediaType = mediaType
    }

    const message = await Message.create(messageData)

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
const getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id

    const messages = await Message.find({
      "recipients.user": userId,
    })
      .populate("event", "title eventCode date time venue")
      .populate("sender", "name")
      .sort({ createdAt: -1 })

    const formattedMessages = messages.map((msg) => {
      const recipient = msg.recipients.find((r) => r.user.toString() === userId.toString())

      let userVotes = []
      if (msg.messageType === "poll" && msg.pollOptions) {
        userVotes = msg.pollOptions
          .map((opt, idx) => (opt.votes.some((v) => v.user.toString() === userId.toString()) ? idx : null))
          .filter((idx) => idx !== null)
      }

      return {
        _id: msg._id,
        event: msg.event,
        sender: msg.sender,
        title: msg.title,
        content: msg.content,
        messageType: msg.messageType,
        pollOptions: msg.pollOptions,
        pollMultiSelect: msg.pollMultiSelect,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        read: recipient?.read || false,
        readAt: recipient?.readAt,
        userVotes: userVotes,
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
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user.id

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

const votePoll = async (req, res) => {
  try {
    const { messageId } = req.params
    const { optionIndex } = req.body
    const userId = req.user.id

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ error: "Message not found" })
    }

    if (message.messageType !== "poll") {
      return res.status(400).json({ error: "Message is not a poll" })
    }

    const option = message.pollOptions[optionIndex]
    if (!option) {
      return res.status(400).json({ error: "Invalid poll option" })
    }

    // Check if user already voted (for single-select polls)
    if (!message.pollMultiSelect) {
      const hasVoted = message.pollOptions.some((opt) => opt.votes.some((v) => v.user.toString() === userId.toString()))

      if (hasVoted) {
        // Remove previous vote
        message.pollOptions.forEach((opt) => {
          opt.votes = opt.votes.filter((v) => v.user.toString() !== userId.toString())
        })
      }
    } else {
      // For multi-select, check if already voted on this option
      const alreadyVoted = option.votes.some((v) => v.user.toString() === userId.toString())
      if (alreadyVoted) {
        option.votes = option.votes.filter((v) => v.user.toString() !== userId.toString())
        await message.save()
        return res.json({
          success: true,
          pollResults: message.pollOptions,
          userVotes: message.pollOptions
            .map((opt, idx) => (opt.votes.some((v) => v.user.toString() === userId.toString()) ? idx : null))
            .filter((idx) => idx !== null),
        })
      }
    }

    // Add vote
    option.votes.push({ user: userId })
    await message.save()

    // Return updated poll results with user votes
    const userVotes = message.pollOptions
      .map((opt, idx) => (opt.votes.some((v) => v.user.toString() === userId.toString()) ? idx : null))
      .filter((idx) => idx !== null)

    res.json({
      success: true,
      pollResults: message.pollOptions,
      userVotes: userVotes,
    })
  } catch (error) {
    console.error("Vote poll error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

// Get messages sent for an event (organizer view)
const getEventMessages = async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Only the organizer can view event messages" })
    }

    const messages = await Message.find({ event: eventId }).populate("sender", "name").sort({ createdAt: -1 })

    res.json({ messages })
  } catch (error) {
    console.error("Get event messages error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

module.exports = {
  sendMessage,
  getUserMessages,
  markAsRead,
  getEventMessages,
  votePoll,
}
