const mongoose = require("mongoose")

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  votes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      votedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
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
  messageType: {
    type: String,
    enum: ["text", "poll", "media"],
    default: "text",
  },
  pollOptions: [pollOptionSchema],
  pollMultiSelect: {
    type: Boolean,
    default: false,
  },
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
