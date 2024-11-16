const mongoose = require("mongoose");
const membershiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    // required: true,
  },
  coinsPerSeconds: {
    type: Number,
    required: true,
  },
  minningTime: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updateAt: {
    type: Date,
    default: null,
  },
  adminId: {
    type: String,
    required: true,
  },
});

const userMembership = mongoose.model("membership", membershiSchema);
module.exports = userMembership;
