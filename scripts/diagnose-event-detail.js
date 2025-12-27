const http = require("http")
const https = require("https")
const fs = require("fs")
const path = require("path")

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"
const PORT = process.env.PORT || 5000

console.log("🔍 Event Management System - Diagnostic Script")
console.log("=".repeat(60))
console.log(`Backend URL: ${BACKEND_URL}`)
console.log(`Port: ${PORT}`)
console.log("")

function makeRequest(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 5000,
    }

    const protocol = url.startsWith("https") ? https : http

    const req = protocol.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    req.on("timeout", () => {
      req.destroy()
      reject(new Error("Request timeout"))
    })

    req.end()
  })
}

async function checkBackendHealth() {
  console.log("📌 Step 1: Checking Backend Health...")
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`)
    console.log("✅ Backend is running")
    console.log(`   Status: ${response.status}`)
    console.log(`   Response: ${JSON.stringify(response.data)}`)
    return true
  } catch (error) {
    console.log("❌ Backend is not responding")
    console.log(`   Error: ${error.message}`)
    return false
  }
}

async function checkUploadsFolder() {
  console.log("\n📌 Step 2: Checking Uploads Folder...")
  try {
    const uploadsPath = path.join(__dirname, "..", "backend", "uploads")
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath)
      console.log(`✅ Uploads folder exists at: ${uploadsPath}`)
      console.log(`   Files count: ${files.length}`)
      if (files.length > 0) {
        console.log(`   Sample files: ${files.slice(0, 3).join(", ")}`)
      }
      return files
    } else {
      console.log("⚠️  Uploads folder does not exist at: " + uploadsPath)
      return []
    }
  } catch (error) {
    console.log(`❌ Error checking uploads: ${error.message}`)
    return []
  }
}

async function getAvailableEvents() {
  console.log("\n📌 Step 3: Fetching Available Events...")
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/events`)
    console.log(`✅ Events endpoint responds with status: ${response.status}`)

    const events = response.data.events || response.data.data?.events || []

    if (events.length === 0) {
      console.log("⚠️  No events found in database")
      return null
    }

    const event = events[0]
    console.log(`   Found ${events.length} total events`)
    console.log(`   First event ID: ${event._id}`)
    console.log(`   Event title: ${event.title}`)
    console.log(`   Has image: ${event.image ? "Yes - " + event.image : "No"}`)
    return event
  } catch (error) {
    console.log("❌ Failed to fetch events")
    console.log(`   Error: ${error.message}`)
    return null
  }
}

async function testGetEventById(eventId) {
  console.log(`\n📌 Step 4: Testing GET /api/events/${eventId}...`)
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/events/${eventId}`)
    console.log("✅ Event endpoint responds")
    console.log(`   Status: ${response.status}`)
    console.log(`   Response keys: ${Object.keys(response.data).join(", ")}`)

    const event = response.data.event || response.data.data?.event || response.data
    console.log(`   Event title: ${event.title}`)
    console.log(`   Event date: ${event.date}`)
    console.log(`   Event image: ${event.image || "No image"}`)
    console.log(`   Event venue: ${event.venue || "No venue"}`)
    console.log(
      `   Event description: ${event.description ? event.description.substring(0, 50) + "..." : "No description"}`,
    )

    return event
  } catch (error) {
    console.log("❌ Event endpoint failed")
    console.log(`   Error: ${error.message}`)
    return null
  }
}

async function checkImageAccess(imagePath) {
  if (!imagePath) {
    console.log("\n📌 Step 5: Skipping image access check (no image)")
    return false
  }

  console.log(`\n📌 Step 5: Checking Image Access...`)
  try {
    const imageUrl = `${BACKEND_URL}${imagePath}`
    console.log(`   Testing URL: ${imageUrl}`)

    const response = await makeRequest(imageUrl, "HEAD")
    console.log("✅ Image is accessible")
    console.log(`   Status: ${response.status}`)
    return true
  } catch (error) {
    console.log("❌ Image is not accessible")
    console.log(`   Error: ${error.message}`)
    return false
  }
}

async function runDiagnostics() {
  try {
    const backendHealthy = await checkBackendHealth()
    if (!backendHealthy) {
      console.log("\n⚠️  Backend is not running. Cannot continue diagnostics.")
      console.log("Make sure to run: npm start (in backend folder)")
      process.exit(1)
    }

    await checkUploadsFolder()
    const event = await getAvailableEvents()

    if (!event) {
      console.log("\n⚠️  No events available. Create an event first in the app.")
      process.exit(0)
    }

    const fetchedEvent = await testGetEventById(event._id)
    if (fetchedEvent) {
      await checkImageAccess(fetchedEvent.image)
    }

    console.log("\n" + "=".repeat(60))
    console.log("📊 Diagnostic Summary:")
    console.log("=".repeat(60))
    console.log(`Backend Health: ${backendHealthy ? "✅ OK" : "❌ FAILED"}`)
    console.log(`Events Available: ${event ? "✅ YES" : "❌ NO"}`)
    console.log(`Event ID for testing: ${event?._id}`)

    console.log("\n📝 Frontend Configuration:")
    console.log(`API_URL should be: /api`)
    console.log(`Backend URL: ${BACKEND_URL}`)
    console.log(`Full image URL format: ${BACKEND_URL}\${event?.image}`)

    console.log("\n📝 Next Steps:")
    console.log("1. If backend is ❌ FAILED: Make sure the backend server is running")
    console.log("2. If events are ❌ NO: Create an event in the application")
    console.log("3. Check browser console (F12) on EventDetail page for errors")
    console.log("4. Check Network tab in browser to see actual API requests")
  } catch (error) {
    console.log(`\n❌ Unexpected error: ${error.message}`)
  }
}

runDiagnostics()
