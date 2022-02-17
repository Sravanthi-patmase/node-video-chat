const mongoose = require('mongoose');

const EmpSchema = mongoose.Schema({
    username:  {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    meetingId: {
        type: String,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Emp', EmpSchema);