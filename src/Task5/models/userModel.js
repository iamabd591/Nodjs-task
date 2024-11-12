const mongoose = require("mongoose");

const minningUser = new mongoose.Schema({
  name: {
    type: String,
    minlength: 4,
    required: true,
    match: /^[A-Za-z]+(\s[A-Za-z]+)*$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

const User = mongoose.model("User", minningUser);
module.exports = User;
