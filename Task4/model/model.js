const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    minlength: 4,
    match: /^[A-Za-z\s]+$/, // Corrected the regex,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Corrected the regex
  },
  password: {
    type: String,
    minlength: 8,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{13,15}$/, // Corrected the regex
  },
});

module.exports = mongoose.model("User", userSchema);
