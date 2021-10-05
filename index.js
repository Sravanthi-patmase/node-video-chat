const express = require('express');
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}
const mongo = require('mongodb').MongoClient;
const app = express();

var router = express.Router();
const port = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: true }))
app.use(express.json());
const mongoose = require('mongoose');
const authDecode = require('./middlewares/auth');
const controller = require('./controllers/emp');
const http = require("http").createServer(app);
global.io = require("socket.io")(http);
const empRoutes = require('./routes/emp');
function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

//*********************** */
// const { MongoClient } = require('mongodb');
// const uri = "mongodb+srv://mean-video-chat:<Sravanthi21>@cluster0.inzp0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   client.close();
// });
//*********************** */
const { chatMsg } = require('./controllers/emp');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://mean-video-chat:Sravanthi21@cluster0.inzp0.mongodb.net/VideoChat?retryWrites=true&w=majority', {
  // mongoose.connect('mongodb://localhost:27017/videoChat',{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Successfully connected to the database");
}).catch(err => {
  console.log('Could not connect to the database.', err);
  process.exit();
});

app.get('/', (req, res) => {
  res.json({ "message": "Hello World" });
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Origin', 'mongodb+srv://mean-video-chat:Sravanthi21@cluster0.inzp0.mongodb.net/VideoChat?retryWrites=true&w=majority');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
});
http.listen(port, () => {
  console.log(`Node server is listening on port ${port}`);
});

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  res.append('Content-Type', 'application/json');
  res.sendError = function (msg) {
    res.status(200).json({ code: 200, status: 'error', message: msg });
  }
  res.sendSuccess = function (msg, data = []) {
    res.status(200).json({ code: 200, status: 'ok', message: msg, data: data });
  }
  next();
});
app.use('/api', empRoutes);
app.use(requireHTTPS);

var roomDetails = "";
// mongo.connect('mongodb://localhost:27017',{
mongo.connect('mongodb+srv://mean-video-chat:Sravanthi21@cluster0.inzp0.mongodb.net?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, async function (err, db) {
  if (err) throw err;
  global.io.on('connection', socket => {
    console.log('Some client conneced');
    var db1 = db.db('VideoChat');
    socket.on("joinRoom", async (data) => {
      // await controller.createRoom(data);
      var roomId = data.roomId;
      data.meetingId = data.roomId;
      var userId = data.userId;
      var userName = data.userName;
      var total = io.engine.clientsCount;
      socket.join(roomId);
      // socket.to(roomId).broadcast.emit('user-connected', userId, username);
      db1.collection('chats', (err, collection) => {
        if (err) throw err;
        collection.find({ meetingId: roomId }).toArray((err, items) => {
          if (err) throw err;
          io.to(roomId).emit("output", items);
          socket.on('clear', data => {
            collection.deleteMany({ meetingId: data.meetingId }, () => {
              socket.emit('cleared');
            });
            db1.collection("participantsList", async (err, collection) => {
              collection.deleteMany({ roomId: data.meetingId }, () => {
                console.log("room deleted Successfully");
              });
            })
          });
        });
      });
      db1.collection('participantsList', async (err, collection) => {
        if (err) throw err;
        var msgData = userName + " joined the Room";
        var res = "";
        collection.find({ roomId: roomId }).toArray(async (err, items) => {
          if (items.length >= 1) {
            collection.find({ roomId: roomId, "roomData.userId": userId }).toArray(async (err, items) => {
              if (items.length >= 1) {
                res = await collection.findOneAndUpdate({ roomId: roomId, "roomData.userId": userId }, { $set: { "roomData.$.msgData": msgData, "roomData.$.insertedAt": new Date(), "roomData.$.isActive": 1 } }, { upsert: true });
              } else {
                res = await collection.findOneAndUpdate({ roomId: roomId }, { $push: { "roomData": { userId: userId, userName: userName, msgData: msgData, insertedAt: new Date(), isActive: 1 } } }, { upsert: true })
              }
              socket.to(roomId).emit("userConnected", { userId: userId, userName: userName });
              notifyRoomDetails(data).then(function (resp) {
                socket.to(roomId).emit("showParticipants", resp);
                io.to(socket.id).emit("showParticipants", resp);
              });
            });
          } else {
            res = await collection.insertOne({ roomId: roomId, "roomData": [{ msgData: msgData, insertedAt: new Date(), isActive: 1, userId: userId, userName: userName }], createdAt: new Date(), updatedAt: new Date() });
            socket.to(roomId).emit("userConnected", { userId: userId, userName: userName });
            notifyRoomDetails(data).then(function (resp) {
              socket.to(roomId).emit("showParticipants", resp);
              io.to(socket.id).emit("showParticipants", resp);
            });
          }
        });
      });

      socket.on("message", (msgData) => {
        var message = msgData.msg;
        var userName = msgData.name;
        var meetingId = msgData.meetingId;
        chat(message, userName, roomId, meetingId);
      });
      socket.on('disconnect', async () => {
        socket.to(roomId).emit("userDisconnected", { userId: userId, userName: userName });
        db1.collection('participantsList', async (err, collection) => {
          if (err) throw err;
          var msgData = userName + " left the Room";
          res = await collection.findOneAndUpdate({ roomId: roomId, "roomData.userId": userId }, { $set: { "roomData.$.msgData": msgData, "roomData.$.insertedAt": new Date(), "roomData.$.isActive": 0 } });
          if (res) {
            notifyRoomDetails(data).then(function (resp) {
              socket.to(roomId).emit("showParticipants", resp);
            });
          }
        });
      });
      socket.on('leave', async (data) => {
        db1.collection('participantsList', async (err, collection) => {
          if (err) throw err;
          var msgData = userName + " left the Room";
          res = await collection.findOneAndUpdate({ roomId: roomId, "roomData.userId": userId }, { $set: { "roomData.$.msgData": msgData, "roomData.$.insertedAt": new Date(), "roomData.$.isActive": 0 } });
          if (res) {
            socket.to(data.meetingId).emit("userDisconnected", { userId: data.peerId, userName: userName });
            notifyRoomDetails(data).then(function (resp) {
              socket.to(roomId).emit("showParticipants", resp);
            });
          }
        });
      });
      socket.on('showParticipants', async (data) => {
        var response = await notifyRoomDetails(data);
        io.to(socket.id).emit("showParticipants", response); //broadcast all the users in room including sender
      });
    });

    async function chat(msg, name, roomId, meetingId) {
      var db1 = db.db('VideoChat');
      db1.collection('chats', async (err, collection) => {
        if (err) throw err;
        collection.find().toArray(async (err, items) => {
          if (err) throw err;
          if (name == '' || msg == '') {
          } else {
            let res = await collection.insertOne({ name: name, msg: msg, createdAt: new Date(), meetingId: meetingId });
            if (res) {
              let items = await collection.find({ meetingId: meetingId }).toArray();
              if (items.length > 0) {
                socket.to(roomId).emit("output", items);
              }
            }
          }
        });
      });
    }

    function notifyRoomDetails(data, callback) {
      return new Promise((resolve, reject) => {
        db1.collection('participantsList', async (err, collection) => {
          if (err) throw err;
          // collection.find({ roomId: data.meetingId, "roomData.isActive": 1 }).sort({ createdAt: -1 }).toArray().then(async (resData) => {
            collection.aggregate([{ $match: { roomId: data.meetingId } },
              {
                $project: {
                  "Members":{
                    "$filter": {
                      "input": "$roomData",
                      "as": "part",
                      "cond": { "$eq": ["$$part.isActive", 1] }
                    }
                  }
                }
              }
              ]).toArray().then((resData) => {
                  collection.aggregate([{ $match: { roomId: data.meetingId } },
                  {
                    $project: {
                      no: {
                        "$size": {
                          "$filter": {
                            "input": "$roomData",
                            "as": "part",
                            "cond": { "$eq": ["$$part.isActive", 1] }
                          }
                        }
                      }
                    }
                  }
                  ]).toArray().then((res) => {
                    response = { response: resData, count: res };
                    resolve(response)
                  });
          });
        });
      })
    }
  });
});

