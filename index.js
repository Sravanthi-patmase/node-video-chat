const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
const mongo = require('mongodb').MongoClient;
const app = express();

var router = express.Router();
const port = process.env.PORT || 4000;
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
const mongoose = require('mongoose');
const authDecode = require('./middlewares/auth');
const http = require("http").createServer(app);
// const server = http.createServer(app);

global.io = require("socket.io")(http);
const { v4: uuidv4 } = require("uuid");

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/crudAPIs', {
useNewUrlParser: true,
useUnifiedTopology: true 
}).then(() => {
  console.log("Successfully connected to the database");
  //socket io 
  
}).catch(err => {
  console.log('Could not connect to the database.', err);
  process.exit();
});

app.get('/', (req, res) => {
   res.json({"message": "Hello World"});
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
});
http.listen(port, () => {
   console.log(`Node server is listening on port ${port}`);
});

const empRoutes = require('./routes/emp');

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
app.get("/createRoom", (req, res) => {
  console.log('GGGGGG')
  res.redirect(`/${uuidv4()}`);
});
app.get("/:room", (req, res) => {
  res.render("index", { roomId: req.params.room });
});

// global.io.on('connection', (socket) => {
//   console.log('socket connected');
//   socket.emit('test event','hello i am server');
// });

mongo.connect('mongodb://localhost:27017/',{
  useNewUrlParser: true,
  useUnifiedTopology: true 
  }, function(err, db) {
    console.log('YYY')
  if (err) throw err;
  global.io.on('connection', socket => {
    console.log('Some client conneced');
    // video chat related events
    socket.on('room_join_request', payload => {
      console.log('DDDD',payload)
      socket.join(payload.roomName, err => {
          if (!err) {
              io.in(payload.roomName).clients((err, clients) => {
                console.log('room_users')
                  if (!err) {
                      io.in(payload.roomName).emit('room_users', clients)
                  }
              });
          }
      })
    });
    socket.on('offer_signal', payload => {
      io.to(payload.calleeId).emit('offer', { signalData: payload.signalData, callerId: payload.callerId });
    });

    socket.on('answer_signal', payload => {
        io.to(payload.callerId).emit('answer', { signalData: payload.signalData, calleeId: socket.id });
    });

    socket.on('disconnect', () => {
        io.emit('room_left', { type: 'disconnected', socketId: socket.id })
    })
    // video chat related events
    var db1 = db.db('crudAPIs');
    db1.collection('chats', (err, collection) => {
      if (err) throw err;
      collection.find().toArray((err, items) => {
        if (err) throw err;
        socket.emit('output', items);
        socket.on('input', data => {
          console.log(data,'Data')
          let name = data.name;
          let msg = data.msg;
          //check for msg and name
          if (name == '' || msg == '') {
            //send error status
            sendStatus('Please enter name and msg');
          } else {
            //insert msg into db
            collection.insertOne({ name: name, msg: msg }, () => {
              // io.emit('output', [data]);
              // send status obj
              sendStatus({
                msg: 'Message sent',
                clear: true
              });
            });
          }
        });
        // handle clear btn
            socket.on('clear', data => {
              //remove all chats from collection
              collection.deleteMany({}, () => {
                //emit cleared
                console.log("Cleared");
                socket.emit('cleared');
              });
            });
      });
    });
    // create function to send status
        sendStatus = s => {
          socket.emit('status', s);
        };
  });
});

