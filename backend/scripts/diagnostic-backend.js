const mongoose = require("mongoose")
const http = require("http")
require("dotenv").config()

require("../models/Event")
require("../models/Polls")

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/event-management"
const PORT = process.env.PORT || 5000

function makeHttpRequest(options, callback) {
  const req = http.request(options, (res) => {
    let data = ""
    res.on("data", (chunk) => (data += chunk))
    res.on("end", () => {
      callback(null, { status: res.statusCode, data: data })
    })
  })
  req.on("error", callback)
  req.end()
}

async function runDiagnostics() {
  console.log("\n========== BACKEND DIAGNOSTICS ==========\n")

  // 1. Check environment variables
  console.log("1. Environment Variables:")
  console.log(`   - MONGO_URI: ${MONGO_URI ? "✓ Set" : "✗ Not set"}`)
  console.log(`   - PORT: ${PORT}`)

  // 2. Check MongoDB connection
  console.log("\n2. MongoDB Connection:")
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("   ✓ MongoDB connected successfully")

    // Check if Event model exists and has data
    const Event = mongoose.model("Event")
    const eventCount = await Event.countDocuments()
    console.log(`   ✓ Event collection has ${eventCount} documents`)

    // Check if Poll model exists
    const Poll = mongoose.model("Poll")
    const pollCount = await Poll.countDocuments()
    console.log(`   ✓ Poll collection has ${pollCount} documents`)

    // Get sample event ID for API testing
    const sampleEvent = await Event.findOne()
    if (sampleEvent) {
      console.log(`   ✓ Sample Event ID: ${sampleEvent._id}`)

      // Test API endpoint
      console.log("\n3. Testing Backend API Endpoint:")
      const options = {
        hostname: "localhost",
        port: PORT,
        path: `/api/polls/event/${sampleEvent._id}`,
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
        },
      }

      makeHttpRequest(options, (err, res) => {
        if (err) {
          console.log(`   ✗ Error making request: ${err.message}`)
        } else {
          console.log(`   - GET /api/polls/event/${sampleEvent._id} returned status ${res.status}`)
          console.log(`   - Response: ${res.data}`)
        }

        // Check Poll structure
        console.log("\n4. Checking Poll Schema:")
        const pollSchema = Poll.schema.paths
        console.log(`   ✓ Poll has fields: ${Object.keys(pollSchema).join(", ")}`)

        mongoose.disconnect()
        console.log("\n✓ Diagnostics complete\n")
      })
    } else {
      console.log("   ⚠ No sample events found in database")
      mongoose.disconnect()
    }
  } catch (error) {
    console.error("✗ Error:", error.message)
    process.exit(1)
  }
}

runDiagnostics()
