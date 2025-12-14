import { BrowserRouter, Routes, Route } from "react-router-dom"
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/:id" element={<EventDetail />} />
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
  )
}

export default App
