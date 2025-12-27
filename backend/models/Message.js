const mongoose = require("mongoose")

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  }],
})

const messageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Please provide message title"],
  },
  content: {
    type: String,
    required: [true, "Please provide message content"],
  },
  // Message type: 'text', 'poll', 'media'
  messageType: {
    type: String,
    enum: ["text", "poll", "media"],
    default: "text",
  },
  // Poll options (only for messageType: 'poll')
  pollOptions: [pollOptionSchema],
  // Allow multiple votes
  pollMultiSelect: {
    type: Boolean,
    default: false,
  },
  // Media attachments (for mp3, mp4, images)
  mediaUrl: {
    type: String,
  },
  mediaType: {
    type: String,
    enum: ["image", "audio", "video"],
  },
  recipients: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      read: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Message", messageSchema)
