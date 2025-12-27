const http = require("http")
require("dotenv").config()

const eventId = "test-event-id"
const token = "test-token"

const options = {
  hostname: "localhost",
  port: process.env.PORT || 5000,
  path: `/api/polls/event/${eventId}`,
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
}

const req = http.request(options, (res) => {
  console.log(`[DIAGNOSTIC] Status: ${res.statusCode}`)
  console.log(`[DIAGNOSTIC] Headers:`, res.headers)

  let data = ""
  res.on("data", (chunk) => {
    data += chunk
  })

  res.on("end", () => {
    console.log(`[DIAGNOSTIC] Response Body:`, data)
    if (res.statusCode === 404) {
      console.log(`[DIAGNOSTIC] ❌ Route not found or auth failed - getting 404`)
      console.log(`[DIAGNOSTIC] Path called: ${options.path}`)
      console.log(`[DIAGNOSTIC] Token sent: ${token ? "Yes" : "No"}`)
    } else if (res.statusCode === 401) {
      console.log(`[DIAGNOSTIC] ❌ Unauthorized - token invalid`)
    } else if (res.statusCode === 200) {
      console.log(`[DIAGNOSTIC] ✅ Success`)
    }
  })
})

req.on("error", (error) => {
  console.error(`[DIAGNOSTIC] Error:`, error.message)
  if (error.code === "ECONNREFUSED") {
    console.log(`[DIAGNOSTIC] ❌ Backend is not running on port ${process.env.PORT || 5000}`)
  }
})

console.log(`[DIAGNOSTIC] Testing polls endpoint...`)
console.log(`[DIAGNOSTIC] URL: http://localhost:${process.env.PORT || 5000}/api/polls/event/${eventId}`)
req.end()
