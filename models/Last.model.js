const mongoose = require('mongoose');

const LastMatch = new mongoose.Schema({
  last: Number
});

module.exports = mongoose.model('LastMatch', LastMatch);