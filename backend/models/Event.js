const mongoose = require("mongoose")
const generateEventCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const generatePIN = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide event title"],
  },
  eventCode: {
    type: String,
    unique: true,
    uppercase: true,
  },
  eventType: {
    type: String,
    enum: ["seminar", "concert", "meet-up", "workshop", "conference", "webinar", "other"],
    required: [true, "Please provide event type"],
  },
  area: {
    type: String,
    required: [true, "Please provide event area"],
  },
  accessType: {
    type: String,
    enum: ["open", "invite-only"],
    default: "open",
  },
  organizerPIN: {
    type: String,
  },
  attendeePIN: {
    type: String,
  },
  description: String,
  detailedDescription: String,
  images: [String],
  videos: [String],
  activitiesAndBenefits: String,
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
  attendingCount: {
    type: Number,
    default: 0,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collaborators: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  category: String,
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming",
  },
  budget: {
    total: {
      type: Number,
      default: 0,
    },
    income: {
      type: Number,
      default: 0,
    },
    spent: {
      type: Number,
      default: 0,
    },
    expenses: [
      {
        description: String,
        amount: Number,
        category: String,
        taskId: mongoose.Schema.Types.ObjectId,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  tasks: [
    {
      title: String,
      description: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      budget: {
        type: Number,
        default: 0,
      },
      spent: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: "pending",
      },
      deadline: Date,
      completedAt: Date,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  accessPermissions: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      permission: {
        type: String,
        enum: ["view", "edit", "manage"],
        default: "view",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

eventSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Generate unique event code
    let code = generateEventCode()
    let existing = await mongoose.model("Event").findOne({ eventCode: code })
    while (existing) {
      code = generateEventCode()
      existing = await mongoose.model("Event").findOne({ eventCode: code })
    }
    this.eventCode = code

    // Generate PINs
    this.organizerPIN = generatePIN()
    this.attendeePIN = generatePIN()
  }
  next()
})

module.exports = mongoose.model("Event", eventSchema)
