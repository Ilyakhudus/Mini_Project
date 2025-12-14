const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide event title"],
  },
  description: String,
  date: {
    type: Date,
    required: [true, "Please provide event date"],
  },
  time: {
    type: String,
    required: [true, "Please provide event time"],
  },
  venue: {
    type: String,
    required: [true, "Please provide venue"],
  },
  price: {
    type: Number,
    required: [true, "Please provide event price"],
    default: 0,
  },
  image: String,
  capacity: {
    type: Number,
    required: [true, "Please provide capacity"],
    default: 100,
  },
  registeredCount: {
    type: Number,
    default: 0,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: String,
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Event", eventSchema)
