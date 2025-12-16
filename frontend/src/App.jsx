import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Login from "./pages/Login"
import Register from "./pages/Register"
import EventDetail from "./pages/EventDetail"
import CreateEvent from "./pages/CreateEvent"
import EditEvent from "./pages/EditEvent"
import Dashboard from "./pages/Dashboard"
import UserRegistrations from "./pages/UserRegistrations"
import ProtectedRoute from "./components/ProtectedRoute"
import Landing from "./pages/Landing"
import AttendeeHub from "./pages/AttendeeHub"
import OrganizerHub from "./pages/OrganizerHub"
import EventManagement from "./pages/EventManagement"
import LoginForEvent from "./pages/LoginForEvent"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-for-event/:eventId" element={<LoginForEvent />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/attendee"
            element={
              <ProtectedRoute roles={["attendee"]}>
                <AttendeeHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <OrganizerHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/event/:id"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <EventManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-event/:id"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <EditEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["admin", "organizer"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute>
                <UserRegistrations />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
