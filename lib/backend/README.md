# Event Management System - Backend

## Overview
Express.js backend for Event Management System with MongoDB database.

## Key Features
- JWT Authentication
- Role-based Access Control (Admin, Organizer, Attendee)
- Event CRUD operations
- Event registration system
- Image upload support
- Pagination and search
- Error handling middleware

## Dependencies
- express: Web framework
- mongoose: MongoDB ORM
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- multer: File upload handling
- cors: CORS middleware
- dotenv: Environment variables

## Running the Server
\`\`\`bash
npm install
npm run dev
\`\`\`

Server runs on port 5000 by default.

## File Structure
- `config/database.js` - Database connection
- `models/` - Mongoose schemas
- `controllers/` - Route handlers
- `routes/` - API endpoints
- `middleware/` - Auth, error handling, file uploads
- `utils/` - Utility functions
- `server.js` - Express app entry point
