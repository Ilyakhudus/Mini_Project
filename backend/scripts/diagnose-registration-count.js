const mongoose = require("mongoose")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../.env") })

const Event = require("../models/Event")
const Registration = require("../models/Registration")

async function diagnoseRegistrationCounts() {
  try {
    console.log("[DIAGNOSTIC] Connecting to MongoDB...")
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/event-management"
    console.log(`[DIAGNOSTIC] Using connection URI: ${mongoUri.substring(0, 50)}...`)
    await mongoose.connect(mongoUri)
    console.log("[DIAGNOSTIC] Connected to MongoDB")

    console.log("\n[DIAGNOSTIC] Fetching all events...")
    const events = await Event.find({})
    console.log(`[DIAGNOSTIC] Found ${events.length} events\n`)

    let discrepancies = 0

    for (const event of events) {
      const storedCount = event.registeredCount || 0
      const actualRegistrations = await Registration.countDocuments({ eventId: event._id })

      console.log(`Event: ${event.title} (ID: ${event._id})`)
      console.log(`  Stored registeredCount: ${storedCount}`)
      console.log(`  Actual registrations: ${actualRegistrations}`)

      if (storedCount !== actualRegistrations) {
        console.log(`  ⚠️  MISMATCH! Difference: ${actualRegistrations - storedCount}`)
        discrepancies++

        // Show registered users
        const registrations = await Registration.find({ eventId: event._id }).populate("userId", "name email")
        registrations.forEach((reg, idx) => {
          console.log(`    ${idx + 1}. ${reg.userId?.name || "Unknown"} (${reg.userId?.email || "N/A"})`)
        })
      } else {
        console.log(`  ✓ Count matches`)
      }
      console.log()
    }

    console.log(`\n[DIAGNOSTIC] Summary: ${discrepancies} event(s) with discrepancies`)

    if (discrepancies > 0) {
      console.log("\n[DIAGNOSTIC] Fixing discrepancies...")
      for (const event of events) {
        const actualCount = await Registration.countDocuments({ eventId: event._id })
        if (event.registeredCount !== actualCount) {
          event.registeredCount = actualCount
          await event.save()
          console.log(`[DIAGNOSTIC] Fixed ${event.title}: registeredCount = ${actualCount}`)
        }
      }
      console.log("[DIAGNOSTIC] All discrepancies fixed!")
    }

    await mongoose.connection.close()
    console.log("\n[DIAGNOSTIC] Disconnected from MongoDB")
  } catch (error) {
    console.error("[DIAGNOSTIC] Error:", error.message)
    process.exit(1)
  }
}

diagnoseRegistrationCounts()
