const mongoose = require('mongoose');

const EmpSchema = mongoose.Schema({
    name:  {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    address:  String, 
    project: {
        type: String,
        enum: ["ABC", "DX Mgmt Talent Pool"],
        required: true
    },
    role: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Emp', EmpSchema);
