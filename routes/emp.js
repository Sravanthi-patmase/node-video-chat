const express = require('express');
const router = express.Router();
const userController = require('../controllers/emp');

// Create a new user
router.post('/create', userController.create);

//login API
router.post('/login', userController.login);

//update meetingId
router.put('/updateMeetingId', userController.updateMeetingId);

//update isActive Status
router.put('/updateActiveStatus',userController.updateActiveStatus);

router.post('/createRoom', userController.createRoom);

module.exports = router;