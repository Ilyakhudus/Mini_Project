const mongoose = require("mongoose")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config({ path: path.join(__dirname, ".env") })

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/event-management"

// Debug: Check if MONGO_URI is loaded
console.log("MONGO_URI exists:", !!process.env.MONGO_URI)
console.log("Using URI:", mongoUri)

// Event Schema (simplified for migration)
const eventSchema = new mongoose.Schema(
  {
    eventCode: String,
    organizerPIN: String,
    attendeePIN: String,
  },
  { strict: false },
)

const Event = mongoose.model("Event", eventSchema)

// Generate unique event code
const generateEventCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate PIN
const generatePIN = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const fixEvents = async () => {
  try {
    await mongoose.connect(mongoUri)
    console.log("Connected to MongoDB")

    const events = await Event.find({
      $or: [
        { eventCode: { $exists: false } },
        { eventCode: null },
        { eventCode: "" },
        { organizerPIN: { $exists: false } },
        { attendeePIN: { $exists: false } },
      ],
    })

    console.log(`Found ${events.length} events to fix`)

    for (const event of events) {
      const updates = {}

      if (!event.eventCode) {
        updates.eventCode = generateEventCode()
      }
      if (!event.organizerPIN) {
        updates.organizerPIN = generatePIN()
      }
      if (!event.attendeePIN) {
        updates.attendeePIN = generatePIN()
      }

      if (Object.keys(updates).length > 0) {
        await Event.updateOne({ _id: event._id }, { $set: updates })
        console.log(`Fixed event ${event._id}:`, updates)
      }
    }

    console.log("Migration complete!")
    process.exit(0)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

fixEvents()
