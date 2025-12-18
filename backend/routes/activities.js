const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getActivities,
  getEventActivities,
  createActivity
} = require('../controllers/activityController');

// Get all activities for the logged-in user
router.get('/', protect, getActivities);

// Get activities for a specific event
router.get('/event/:eventId', protect, getEventActivities);

// Create a new activity
router.post('/', protect, createActivity);

module.exports = router;