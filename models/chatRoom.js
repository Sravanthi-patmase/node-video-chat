const mongoose = require('mongoose');

const ChatMsgSchema = mongoose.Schema({
    message: String,
    fromId: String,
    toId: String
}, {
    timestamps: true
});
module.exports = mongoose.model('ChatMsg', ChatMsgSchema);

