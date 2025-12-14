const express = require("express")
const cors = require("cors")
require("dotenv").config()
const path = require("path")

const connectDB = require("./config/database")
const errorHandler = require("./middleware/errorHandler")

// Connect to database
connectDB()

const app = express()

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" })
})

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
