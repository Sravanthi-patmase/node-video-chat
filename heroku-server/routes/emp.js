const express = require('express');
const router = express.Router();
const userController = require('../controllers/emp');

// Create a new user
router.post('/create', userController.create);

//login API
router.post('/login', userController.login);

//update meetingId
router.put('/updateMeetingId', userController.updateMeetingId);

module.exports = router;