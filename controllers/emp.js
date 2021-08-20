const User = require('../models/emp');
const Msgs = require('../models/chatRoom');
// const makeValidation = require('@withvoid/make-validation')

// Retrieve and return all users from the database.
exports.findAll = (req, res) => {
  User.Emp.find().then(users => {
        res.send(users);
    }).catch(err => {
        res.status(500).send({ message: err.message || "Something went wrong while getting list of users." });
    });
};

exports.fetchOnCondition = (req,res) => {
  console.log('mmmm',req.body.project)
    if(typeof req.body.project != undefined && req.body.project != null && req.body.project != ''  ){
      console.log('1')
      const result = User.find({project: req.body.project}).then(user => {
        res.send(user)
      }).catch(err => {
        res.send(500).send({message: err.message});
      })
      return result;
    }else{
      console.log('2')
      User.find().then(users => {
        res.send(users);
      }).catch(err => {
        res.status(500).send({ message: err.message || "Something went wrong while getting list of users." });
      });
    }
}

//chat implemnetation between 2 employees
exports.chatMsg = (req, res) => {
  console.log(req,'REQUEST')  
  if(!req.body){
    return res.status(400).send({ message: "Please fill all required field" });
  }
  var errors = {};
  if(req.body.fromId == undefined || req.body.fromId == null){
    errors.name = ['fromId is required'];
  }
  if(req.body.toId == undefined || req.body.toId == null){
    errors.name = ['toId is required'];
  }
  if (Object.keys(errors).length) {
    return errors;
  }
  const chatData = new Msgs({
    message: req.body.message,
    fromId: req.body.fromId,
    toId: req.body.toId
  });
  chatData.save().then(data => {
    console.log(data,'inserted msg in db');
    // global.io.emit('output', [data]);
    var socketId = req.body.fromId + '_' + req.body.toId;
    console.log(socketId,'socketId',global.io);
    global.io.sockets.in(socketId).emit('new message', { message: req.body.message, fromId: req.body.fromId, toId: req.body.toId });
    res.send(data);
    }).catch(err => {
      res.status(500).send({message: err.message || "Something went wrong while inserting a msg in db."});
  });
}

// Create and Save a new User
exports.create = (req, res) => {
  console.log("RRRRRRRRRRRRRRRRRRRRRR",req)
  if(req.admin == "SuperAdmin"){
    console.log('##########');
    // Validate request
    if(!req.body) {
      return res.status(400).send({ message: "Please fill all required field" });
    }
    validateBody(req.body);
    if( req.body.project == "DX Mgmt Talent Pool"){
      if( req.body.age >= 40){
        return res.status(404).send({ message: "Age must be less than 40 for this project" });
      }
    }
    const userData = new User({
      name: req.body.name,
      age: parseInt(req.body.age),
      email: req.body.email,
      mobile: req.body.mobile,
      address: req.body.address,
      project: req.body.project,
      role: req.body.role,
    });
    User.find({$or:[{ email: req.body.email },{ mobile: req.body.mobile }]}).then( user => {
      console.log(user)
      if(user.length >= 1) {
        return res.status(404).send({
          message: "Either Email or Mobile already exists." 
        });
      }else{
        userData.save().then(data => {
          console.log(data,'inserted')
          res.send(data);
          }).catch(err => {
            res.status(500).send({message: err.message || "Something went wrong while creating new user."});
        });
      }
    });
  }
  else{
    res.status(500).send({message: "You are not authorized to add an employee"});
  }
};

// Update a User identified by the id in the request
exports.update = (req, res) => {
  console.log(req.admin);
  if(req.admin == "Manager"){
    if(!req.body) {
      return res.status(400).send({ message: "fill all required field" });
    }
    // Find user and update it with the request body
    User.find({$or:[{ email: req.body.email },{ mobile: req.body.mobile }]}).then( user => {
      console.log(user)
      if(user.length >= 1) {
        return res.status(404).send({
          message: "Either Email or Mobile already exists." 
        });
      }else{
        User.findByIdAndUpdate(req.params.id, {
          name: req.body.name,
          age: parseInt(req.body.age),
          email: req.body.email,
          mobile: req.body.mobile,
          address: req.body.address,
          project: req.body.project,
          role: req.body.role
      },{new: true}).then(user => {
        if(!user) {
          return res.status(404).send({ message: "user not found with id " + req.params.id });
        }
        res.send(user);
      }).catch(err => {
        if(err.kind === 'ObjectId') {
          return res.status(404).send({ message: "user not found with id " + req.params.id });
        }
        return res.status(500).send({ message: "Error updating user with id " + req.params.id });
      });
      }
    });
  }else{
    res.status(500).send({message: "You are not authorized to edit employee details"});
  }
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  if(req.admin == "SuperAdmin"){
    User.findByIdAndRemove(req.params.id).then(user => {
      if(!user) {
        return res.status(404).send({ message: "user not found with id " + req.params.id });
      }
      return res.send({message: "user deleted successfully!"});
    }).catch(err => {
      if(err.kind === 'ObjectId' || err.name === 'NotFound') {
        return res.status(404).send({ message: "user not found with id " + req.params.id });
      }
      return res.status(500).send({ message: "Could not delete user with id " + req.params.id });
    });
  }else{
    res.status(500).send({message: "You are not authorized to delete an employee"});
  } 
};

exports.findById = async (req, res) => {
  // User.findOne({ _id: req.id })
  try {
    const user = await User.findOne({ _id: req.id });
    if (!user) throw ({ error: 'No user with this id found' });
    return user;
  } catch (error) {
    throw error;
  }
};
exports.findByEmail = async (req, res) => {
  // User.findOne({ _id: req.id })
  console.log("YYYYYYYYYY",req)
  try {
    const user = await User.findOne({ email: req.email, role: req.role });
    console.log(user,'Úser')
    if (!user) throw ({ error: 'No user with this id found' });
    return user;
  } catch (error) {
    throw error;
  }
};

// Find a single User with a id
exports.findOne = (req, res) => {
  User.findById(req.params.id).then(user => {
    console.log(user,'tttt')
    if(!user) {
      return res.status(404).send({ message: "User not found with id " + req.params.id });
    }
    else{
        if(user.role == 'Manager'){
          const result = User.find({project: user.project}).then(user => {
            res.send(user)
          }).catch(err => {
            res.send(500).send({message: err.message});
          });
          return result;
        }else{
          console.log("uuuuuuu",user)
          return res.status(200).send(user);
        }
    }
  }).catch(err => {
    if(err.kind === 'ObjectId') {
      return res.status(404).send({ message: "User not found with id " + req.params.id });
    }
  return res.status(500).send({ message: "Error getting user with id " + req.params.id });
  });
};

//login API
exports.login = (req, res, next) => {
  console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")
  try{
    if(!req.body) {
      return res.status(400).send({ message: "Please fill all required field" });
    }
    return res.status(200).json({ success: true, authorization: req.authToken, username: req.username });
  }catch(error){
    return res.status(400).json({ success: false, message: error.error });
  }
};

/////validation body method
function validateBody(body, res){
  const errors = {};
  if (!String(body.name).trim() || typeof body.name == undefined) {
    errors.name = ['Name is required'];
  }
  if (!String(body.email).trim() || typeof body.email == undefined ) {
    errors.email = ['Email is required'];
  }
  if (!String(body.mobile).trim() || typeof body.mobile == undefined ) {
    errors.mobile = ['Mobile is required'];
  }
  if (!String(body.age).trim() || typeof body.age == undefined ) {
    errors.age = ['Age is required'];
  }
  if (!String(body.project).trim() || typeof body.project == undefined ) {
    errors.project = ['Project name is required'];
  }
  if (!String(body.role).trim() || typeof body.role == undefined ) {
    errors.role = ['Role is required'];
  }
  if (!(/^[\-0-9a-zA-Z\.\+_]+@[\-0-9a-zA-Z\.\+_]+\.[a-zA-Z]{2,}$/).test(String(body.email))) {
    errors.email = ['Email is not valid.'];
  }
  if (Object.keys(errors).length) {
    return errors;
  }
}