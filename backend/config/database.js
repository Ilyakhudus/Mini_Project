const mongoose = require("mongoose")

const maskUri = (uri) => {
  try {
    // remove credentials for logging
    return uri.replace(/:\/\/.+@/, '://<redacted>@')
  } catch (e) {
    return '<invalid-uri>'
  }
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/event-management"
  console.log(`[db] Attempting to connect to MongoDB at ${maskUri(uri)}`)
  try {
    // Pass server selection timeout via connect options (setting it on mongoose via get/set is invalid in newer versions)
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    console.log("MongoDB Connected")
    return conn
  } catch (error) {
    console.error("Database connection error:", error.message)
    // Throw instead of exiting so callers (tests) can handle it
    throw error
  }
}

module.exports = connectDB
