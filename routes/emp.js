const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/emp');
// Retrieve all users
router.get('/', userController.findAll);
// Create a new user
router.post('/',auth.decode, userController.create);
// Retrieve a single user with id
router.get('/:id', userController.findOne);
// Update a user with id
router.put('/:id',auth.decode, userController.update);
// Delete a user with id
router.delete('/:id', auth.decode, userController.delete);

//retrieve data based on project or retrieve all
router.post('/fetch', userController.fetchOnCondition);

//login with basic auth
// router.get('/login/:id', auth.encode,  userController.login);

router.post('/login', auth.encode1, userController.login);
//username: superadmin@htc.com
//password: SuperAdmin

//chat msgs Api
router.post('/chatMsg', userController.chatMsg);

module.exports = router