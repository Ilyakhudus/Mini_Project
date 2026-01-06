const express = require("express")
const cors = require("cors")
require("dotenv").config()
const path = require("path")
const mongoose = require("mongoose")

const connectDB = require("./config/database")
const errorHandler = require("./middleware/errorHandler")

const app = express()

// DB health endpoint
app.get("/api/health/db", (req, res) => {
  const state = mongoose.connection.readyState
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" }
  res.json({ dbState: states[state] || state })
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/events", require("./routes/events"))
app.use("/api/registrations", require("./routes/registrations"))
app.use("/api/activities", require("./routes/activities"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/api/feedback", require("./routes/feedback"))
app.use("/api/messages", require("./routes/messages"))
app.use("/api/polls", require("./routes/polls"))

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" })
})

// Error handling
app.use(errorHandler)

// Only start the server and connect to DB when this file is the main module and not running tests
if (require.main === module && process.env.NODE_ENV !== "test") {
  // Start server only after DB connection is successful
  ;(async () => {
    try {
      await connectDB()

      const PORT = process.env.PORT || 5000
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
      })
    } catch (err) {
      console.error("[server] Failed to start due to DB error:", err.message)
      process.exit(1)
    }
  })()
}

module.exports = app
