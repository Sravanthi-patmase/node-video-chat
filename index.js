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
app.use(express.json())
const mongoose = require('mongoose');
const authDecode = require('./middlewares/auth');
const http = require("http").createServer(app);
global.io = require("socket.io")(http);
const empRoutes = require('./routes/emp');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/videoChat', {
useNewUrlParser: true,
useUnifiedTopology: true 
}).then(() => {
  console.log("Successfully connected to the database");
}).catch(err => {
  console.log('Could not connect to the database.', err);
  process.exit();
});

app.get('/', (req, res) => {
  res.json({"message": "Hello World"});
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
});
http.listen(port, () => {
   console.log(`Node server is listening on port ${port}`);
});

const { chatMsg } = require('./controllers/emp');

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  res.append('Content-Type', 'application/json');
  res.sendError = function (msg) {
    res.status(200).json({code: 200, status: 'error', message: msg});
  }
  res.sendSuccess = function (msg, data=[]) {
    res.status(200).json({code: 200, status: 'ok', message: msg, data: data});
  }
  next();
});
app.use('/api', empRoutes);

mongo.connect('mongodb://localhost:27017',{
    useNewUrlParser: true,
    useUnifiedTopology: true 
  }, function(err, db) {
  if (err) throw err;
  global.io.on('connection', socket => {
    console.log('Some client conneced');
    var db1 = db.db('videoChat');
    db1.collection('chats', (err, collection) => {
      if (err) throw err;
      collection.find().toArray((err, items) => {
        if (err) throw err;
        socket.emit('output', items);
        // socket.on('output',(data,callBack) => {
        //   console.log('!!!!!!!!!',items)
        //   io.sockets.emit('output',items);
        // });
        socket.on('clear', data => {
          collection.deleteMany({}, () => {
            socket.emit('cleared');
          });
        });
      });
    });
    socket.on('disconnect', () => {
      console.log('disonncted',socket.id)
        io.emit('room_left', { type: 'disconnected', socketId: socket.id })
    });
    socket.on("joinRoom", (data) => {
      console.log(data,'data');
      var roomId= data.roomId;
      var userId = data.userId;
      var userName = data.userName;
      var total = io.engine.clientsCount;
      socket.join(roomId);  
      socket.to(roomId).emit("userConnected", userId); //broadcast all the users in room including sender
      socket.on("message", (msgData) => {
        var message = msgData.msg;
        var userName = msgData.name;
        chat(message,userName,roomId);
      });
      socket.on('disconnect', () => {
        var total = io.engine.clientsCount;
        socket.broadcast.emit('user-disconnected', userId)
      });
    });

    function chat(msg,name,roomId) {
      var db1 = db.db('videoChat');
      db1.collection('chats', (err, collection) => {
        if (err) throw err;
        collection.find().toArray((err, items) => {
          if (err) throw err;
            if (name == '' || msg == '') {
              sendStatus('Please enter name and msg');
            } else {
              collection.insertOne({ name: name, msg: msg,createdAt: new Date() }, () => {
                sendStatus({
                  msg: 'Message sent',
                  clear: true
                });
              });
              collection.find().toArray((err, items) => {
                if (err) throw err;
                io.to(roomId).emit("output", items);
              });
            }
        });
      });
    }
    sendStatus = s => {
      socket.emit('status', s);
    };
  });
});

