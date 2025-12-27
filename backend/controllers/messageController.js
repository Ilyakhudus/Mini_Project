const Message = require("../models/Message")
const Event = require("../models/Event")
const Registration = require("../models/Registration")

// Send message to all registered attendees of an event
exports.sendMessage = async (req, res) => {
  try {
    const { eventId } = req.params
    const { title, content, messageType, pollOptions, pollMultiSelect, mediaUrl, mediaType } = req.body

    // Verify event exists and user is organizer
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ error: "Event not found" })
    }

    // Check if user is organizer or collaborator
    const isOrganizer = event.organizer.toString() === req.user._id.toString()
    const isCollaborator = event.collaborators?.some(
      (c) => c.user.toString() === req.user._id.toString()
    )

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Only the organizer or collaborators can send messages" })
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

    // Prepare message data
    const messageData = {
      event: eventId,
      sender: req.user._id,
      title,
      content,
      messageType: messageType || "text",
      recipients,
    }

    // Add poll options if it's a poll
    if (messageType === "poll" && pollOptions && pollOptions.length > 0) {
      messageData.pollOptions = pollOptions.map((option) => ({
        text: option,
        votes: [],
      }))
      messageData.pollMultiSelect = pollMultiSelect || false
    }

    // Add media if provided
    if (messageType === "media" && mediaUrl) {
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
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user._id

    const messages = await Message.find({
      "recipients.user": userId,
    })
      .populate("event", "title eventCode date time venue")
      .populate("sender", "name")
      .sort({ createdAt: -1 })

    // Format messages with read status and user's poll votes
    const formattedMessages = messages.map((msg) => {
      const recipient = msg.recipients.find((r) => r.user.toString() === userId.toString())
      
      // Get user's votes on poll options
      let userVotes = []
      if (msg.messageType === "poll" && msg.pollOptions) {
        msg.pollOptions.forEach((option, index) => {
          if (option.votes.some((v) => v.user.toString() === userId.toString())) {
            userVotes.push(index)
          }
        })
      }

      // Calculate vote counts for each option
      let pollResults = null
      if (msg.messageType === "poll" && msg.pollOptions) {
        pollResults = msg.pollOptions.map((option) => ({
          text: option.text,
          voteCount: option.votes.length,
        }))
      }

      return {
        _id: msg._id,
        event: msg.event,
        sender: msg.sender,
        title: msg.title,
        content: msg.content,
        messageType: msg.messageType,
        pollOptions: pollResults,
        pollMultiSelect: msg.pollMultiSelect,
        userVotes,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
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

// Vote on a poll option
exports.votePoll = async (req, res) => {
  try {
    const { messageId } = req.params
    const { optionIndex } = req.body
    const userId = req.user._id

    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({ error: "Message not found" })
    }

    if (message.messageType !== "poll") {
      return res.status(400).json({ error: "This message is not a poll" })
    }

    // Check if user is a recipient
    const isRecipient = message.recipients.some((r) => r.user.toString() === userId.toString())
    if (!isRecipient) {
      return res.status(403).json({ error: "You are not a recipient of this message" })
    }

    if (optionIndex < 0 || optionIndex >= message.pollOptions.length) {
      return res.status(400).json({ error: "Invalid option index" })
    }

    // Check if user already voted on this option
    const option = message.pollOptions[optionIndex]
    const alreadyVoted = option.votes.some((v) => v.user.toString() === userId.toString())

    if (alreadyVoted) {
      // Remove vote
      option.votes = option.votes.filter((v) => v.user.toString() !== userId.toString())
    } else {
      // If not multi-select, remove votes from other options first
      if (!message.pollMultiSelect) {
        message.pollOptions.forEach((opt) => {
          opt.votes = opt.votes.filter((v) => v.user.toString() !== userId.toString())
        })
      }
      // Add vote
      option.votes.push({ user: userId, votedAt: new Date() })
    }

    await message.save()

    // Return updated poll results
    const pollResults = message.pollOptions.map((opt) => ({
      text: opt.text,
      voteCount: opt.votes.length,
    }))

    // Get user's current votes
    const userVotes = []
    message.pollOptions.forEach((opt, index) => {
      if (opt.votes.some((v) => v.user.toString() === userId.toString())) {
        userVotes.push(index)
      }
    })

    res.json({
      success: true,
      pollResults,
      userVotes,
    })
  } catch (error) {
    console.error("Vote poll error:", error)
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
      { new: true }
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

    // Check if user is organizer or collaborator
    const isOrganizer = event.organizer.toString() === req.user._id.toString()
    const isCollaborator = event.collaborators?.some(
      (c) => c.user.toString() === req.user._id.toString()
    )

    if (!isOrganizer && !isCollaborator) {
      return res.status(403).json({ error: "Only the organizer or collaborators can view event messages" })
    }

    const messages = await Message.find({ event: eventId })
      .populate("sender", "name")
      .sort({ createdAt: -1 })

    // Add poll results to each message
    const messagesWithResults = messages.map((msg) => {
      const msgObj = msg.toObject()
      if (msg.messageType === "poll" && msg.pollOptions) {
        msgObj.pollResults = msg.pollOptions.map((opt) => ({
          text: opt.text,
          voteCount: opt.votes.length,
        }))
      }
      return msgObj
    })

    res.json({ messages: messagesWithResults })
  } catch (error) {
    console.error("Get event messages error:", error)
    res.status(500).json({ error: "Server error" })
  }
}
