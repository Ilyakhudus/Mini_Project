# Event Management System - Setup Instructions

## Project Structure

\`\`\`
event-management-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── utils/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── index.html
\`\`\`

## Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation Steps

1. **Navigate to backend directory**
   \`\`\`bash
   cd backend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Create .env file**
   \`\`\`
   MONGODB_URI=mongodb://localhost:27017/event-management
   JWT_SECRET=your-secret-key-here
   PORT=5000
   \`\`\`

4. **Create uploads directory**
   \`\`\`bash
   mkdir uploads
   \`\`\`

5. **Start the backend server**
   \`\`\`bash
   npm run dev
   \`\`\`
   - Development: `npm run dev` (with auto-reload)
   - Production: `npm start`

The backend will run on `http://localhost:5000`

## Frontend Setup

### Prerequisites
- Node.js (v14 or higher)

### Installation Steps

1. **Navigate to frontend directory**
   \`\`\`bash
   cd frontend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Events
- `GET /api/events` - Get all events (pagination + search)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (requires auth: organizer/admin)
- `PUT /api/events/:id` - Update event (requires auth)
- `DELETE /api/events/:id` - Delete event (requires auth)
- `GET /api/events/organizer/my-events` - Get organizer's events

### Registrations
- `POST /api/registrations` - Register for event
- `DELETE /api/registrations/:id` - Cancel registration
- `GET /api/registrations` - Get user registrations
- `GET /api/registrations/stats/dashboard` - Get dashboard stats

## Features

### Authentication
- JWT-based authentication
- Role-based access control (admin, organizer, attendee)
- Secure password hashing with bcrypt
- Token stored in localStorage on frontend

### Event Management
- Create, read, update, delete events
- Event pagination and search
- Image uploads for events
- Capacity management

### User Registrations
- Register for events
- Prevent double bookings
- Cancel registrations
- Track capacity

### Dashboard
- View statistics
- Organizer can see their events
- Admin can manage all events

### UI/UX
- Clean, responsive design with Tailwind CSS
- Protected routes based on user role
- Error handling
- Loading states

## Testing the Application

### Test User Accounts

1. **Create Organizer Account**
   - Navigate to `/register`
   - Fill in details and select "Event Organizer" role
   - Login and create events

2. **Create Attendee Account**
   - Navigate to `/register`
   - Fill in details and select "Attendee" role
   - Browse events and register

3. **Admin Access**
   - Currently, admin role must be set via database manually
   - Update user role in MongoDB: `db.users.updateOne({email: "admin@test.com"}, {$set: {role: "admin"}})`

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify MongoDB permissions

### CORS Issues
- Backend CORS is configured for localhost:3000
- If running on different port, update backend server.js

### Image Upload Issues
- Ensure uploads directory exists
- Check file permissions
- Verify file size (max 10MB)

### Authentication Issues
- Clear localStorage: `localStorage.clear()` in browser console
- Re-login and verify token is stored
- Check JWT_SECRET in backend .env

## Deployment

### Backend Deployment (Heroku/Railway)
1. Create account on hosting platform
2. Connect GitHub repository
3. Set environment variables (MONGODB_URI, JWT_SECRET)
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Connect GitHub repository
2. Set environment variables (API URL)
3. Deploy

## Environment Variables

### Backend (.env)
\`\`\`
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=5000
\`\`\`

### Frontend (.env)
\`\`\`
VITE_API_URL=http://localhost:5000/api
\`\`\`

## Security Notes

- Change JWT_SECRET to a strong value in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Validate all user inputs
- Use Row Level Security on database if using cloud
- Keep dependencies updated

## Performance Optimization

- Implement caching for events list
- Use lazy loading for images
- Optimize database queries
- Implement CDN for static assets

## Additional Notes

- This is a production-ready template
- Modify as per your specific requirements
- Add additional features like email notifications, payment integration, etc.
- Consider adding tests for both backend and frontend
