const mongoose = require('mongoose');

const RoomDetailsSchema = mongoose.Schema({
    userName: String,
    userId: String
});
const RoomSchema = mongoose.Schema({
    roomId: String,
    hostName: String,
    roomDetails: [RoomDetailsSchema]
}, {
    timestamps: true
});


module.exports = mongoose.model('Room', RoomSchema);