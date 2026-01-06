// Run this in browser console or create a test file
const API_URL = "/api"

async function runFrontendDiagnostics() {
  console.log("\n========== FRONTEND DIAGNOSTICS ==========\n")

  // 1. Check localStorage
  console.log("1. Local Storage:")
  const token = localStorage.getItem("token")
  const user = localStorage.getItem("user")
  console.log(`   - Token: ${token ? "✓ Set" : "✗ Not set"}`)
  console.log(`   - User: ${user ? "✓ Set" : "✗ Not set"}`)
  if (token) {
    console.log(`   - Token length: ${token.length} chars`)
  }

  // 2. Check API configuration
  console.log("\n2. API Configuration:")
  console.log(`   - API_URL: ${API_URL}`)
  console.log(`   - Full polls endpoint: ${API_URL}/polls/event/:eventId`)

  // 3. Check if we have an eventId (would need to be called from EventManagement page)
  console.log("\n3. Current Page Context:")
  const currentPath = window.location.pathname
  console.log(`   - Current path: ${currentPath}`)

  // Try to get eventId from URL
  const eventIdMatch = currentPath.match(/\/organizer\/event\/([a-zA-Z0-9]+)/)
  if (eventIdMatch) {
    const eventId = eventIdMatch[1]
    console.log(`   ✓ Extracted eventId: ${eventId}`)

    // 4. Test API call
    console.log("\n4. Testing API Call:")
    try {
      const response = await fetch(`${API_URL}/polls/event/${eventId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`   - Status: ${response.status}`)
      console.log(`   - Status Text: ${response.statusText}`)

      const data = await response.json()
      console.log(`   - Response:`, data)

      if (response.ok) {
        console.log(`   ✓ API call successful`)
      } else {
        console.log(`   ✗ API returned error`)
      }
    } catch (error) {
      console.error(`   ✗ Fetch error:`, error.message)
    }
  } else {
    console.log(`   ⚠ Not on EventManagement page - cannot extract eventId`)
    console.log(`   ⚠ Call this diagnostic from the EventManagement page URL: /organizer/event/:id`)
  }

  console.log("\n✓ Frontend diagnostics complete\n")
}

// Run it
runFrontendDiagnostics()
