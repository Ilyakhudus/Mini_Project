export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Event Management System</h1>
          <p className="text-xl text-slate-300">
            A full-stack application with Node.js + Express backend and React + Vite frontend
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Backend</h2>
            <ul className="space-y-2 text-slate-300">
              <li>✓ Node.js + Express API</li>
              <li>✓ MongoDB + Mongoose</li>
              <li>✓ JWT Authentication</li>
              <li>✓ Role-based Access Control</li>
              <li>✓ Image Upload (Multer)</li>
              <li>✓ Event & Registration Management</li>
            </ul>
            <div className="mt-4 p-3 bg-slate-800 rounded text-sm">
              <code>cd backend && npm install && npm run dev</code>
              <p className="text-slate-400 mt-1">Runs on http://localhost:5000</p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Frontend</h2>
            <ul className="space-y-2 text-slate-300">
              <li>✓ React + Vite</li>
              <li>✓ Tailwind CSS</li>
              <li>✓ Axios API Client</li>
              <li>✓ Protected Routes</li>
              <li>✓ User Authentication</li>
              <li>✓ Event CRUD Operations</li>
            </ul>
            <div className="mt-4 p-3 bg-slate-800 rounded text-sm">
              <code>cd frontend && npm install && npm run dev</code>
              <p className="text-slate-400 mt-1">Runs on http://localhost:3000</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Setup Instructions</h2>
          <ol className="space-y-3 text-slate-300">
            <li>
              <span className="font-semibold">1. MongoDB Setup:</span> Ensure MongoDB is running locally or update .env
              with a remote MongoDB URI
            </li>
            <li>
              <span className="font-semibold">2. Backend Setup:</span> Navigate to backend folder, install dependencies,
              and start the server
            </li>
            <li>
              <span className="font-semibold">3. Frontend Setup:</span> Navigate to frontend folder, install
              dependencies, and start the dev server
            </li>
            <li>
              <span className="font-semibold">4. Access Application:</span> Open http://localhost:3000 in your browser
            </li>
          </ol>
        </div>

        <div className="bg-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid md:grid-cols-3 gap-4 text-slate-300">
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm">User registration and login with JWT tokens stored in localStorage</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Event Management</h3>
              <p className="text-sm">Create, read, update, and delete events with image uploads</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Registrations</h3>
              <p className="text-sm">Users can register for events with capacity management and duplicate prevention</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Admin Dashboard</h3>
              <p className="text-sm">View statistics and manage all events and users</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Search & Pagination</h3>
              <p className="text-sm">Search events and browse with pagination support</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Role-Based Access</h3>
              <p className="text-sm">Different permissions for admin, organizer, and attendee roles</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
