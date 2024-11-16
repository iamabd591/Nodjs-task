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
  userMembership: {
    type: String,
    default: "Free",
  },
  memberShipStartDate: {
    type: Date,
    default: Date.now(),
  },
  memberShipEndDate: {
    type: Date,
    default: null,
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "membership",
  },
});

const User = mongoose.model("User", minningUser);
module.exports = User;
