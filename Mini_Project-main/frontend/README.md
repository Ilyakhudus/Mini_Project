# Event Management System - Frontend

## Overview
React + Vite frontend for Event Management System with Tailwind CSS styling.

## Key Features
- User authentication (login/register)
- Event browsing with search and pagination
- Event details view
- Event creation and management (for organizers)
- User registrations management
- Dashboard with statistics
- Role-based access control
- Responsive design

## Dependencies
- react: UI library
- react-router-dom: Routing
- axios: HTTP client
- tailwindcss: CSS framework

## Running the Application
\`\`\`bash
npm install
npm run dev
\`\`\`

Frontend runs on port 3000 by default.

## File Structure
- `pages/` - Page components
- `components/` - Reusable components
- `hooks/` - Custom hooks
- `utils/` - Utility functions and API calls
- `App.jsx` - Main app component

## API Integration
All API calls are made through `src/utils/api.js` with automatic JWT token handling.
