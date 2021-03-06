const User = require('../models/emp');
const Msgs = require('../models/chatRoom');

// Create and Save a new User
exports.create = (req, res) => {
  console.log("RRRRRRRRRRRRRRRRRRRRRR",req.body)
    if(!req.body) {
      return res.status(400).send({ message: "Please fill all required field" });
    }
    validateBody(req.body);
    const userData = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });
    User.find({ email: req.body.email }).then( user => {
      console.log(user)
      if(user.length >= 1) {
        return res.status(404).send({
          message: "Email already exists." 
        });
      }else{
        userData.save().then(data => {
          console.log(data,'inserted');
          res.send(data);
          }).catch(err => {
            res.status(500).send({message: err.message || "Something went wrong while creating new user."});
        });
      }
    });
};
exports.login = async (req, res) => {
  console.log('SSSSSSSSSSSSSS')
  try {
      const userPassword = await User.findOne({password: req.body.password,email: req.body.email});
      console.log(userPassword,'userData')
      if(!userPassword){
        return res.send({Success:false, message: "Email or Password is incorrect"});
      } 
      else{
        return res.send({Success: true, message: "Success",data: userPassword});
      }
    // }
  } catch (error) {
    throw error;
  }
};
exports.updateActiveStatus = async(req, res) => {
  try{
    User.find({$or:[{ email: req.body.email }]}).then( user => {
      if(user.length < 1) {
        return res.status(404).send({
          message: "Email doesnot exists." 
        });
      }else{
          User.findByIdAndUpdate(user[0].id, {
            isActive: req.body.isActive,
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
  }catch(error){
    throw error;
  }
}
exports.updateMeetingId = async(req, res) => {
  console.log(req.body,'bodyupdatememeintg')
  User.find({$or:[{ email: req.body.email },{ password: req.body.password }]}).then( user => {
    if(user.length < 1) {
      return res.status(404).send({
        message: "Email doesnot exists." 
      });
    }else{
        User.findByIdAndUpdate(user[0].id, {
          meetingId: req.body.meetingId,
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
}

/////////////////////////////////////////////////validation body method
function validateBody(body, res){
  const errors = {};
  if (!String(body.username).trim() || typeof body.username == undefined) {
    errors.username = ['Name is required'];
  }
  if (!String(body.email).trim() || typeof body.email == undefined ) {
    errors.email = ['Email is required'];
  }
  if (!String(body.password).trim() || typeof body.password == undefined ) {
    errors.password = ['Role is required'];
  }
  if (!(/^[\-0-9a-zA-Z\.\+_]+@[\-0-9a-zA-Z\.\+_]+\.[a-zA-Z]{2,}$/).test(String(body.email))) {
    errors.email = ['Email is not valid.'];
  }
  if (Object.keys(errors).length) {
    return errors;
  }
}