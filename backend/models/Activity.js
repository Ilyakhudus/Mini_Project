const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Please provide activity title"],
  },
  description: String,
  time: {
    type: String,
    required: [true, "Please provide activity time"],
  },
  venue: {
    type: String,
    required: [true, "Please provide activity venue"],
  },
  duration: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Activity", activitySchema)
