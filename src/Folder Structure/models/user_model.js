const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    match: /^[A-Za-z\s]+$/,
    required: true,
    type: String,
    minlength: 4,
  },
  email: {
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true,
    type: String,
    unique: true,
  },
  password: {
    required: true,
    type: String,
    minlength: 8,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
