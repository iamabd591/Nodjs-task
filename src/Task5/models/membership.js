const mongoose = require("mongoose");
const membershiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
});

const userMembership = mongoose.model("membership", membershiSchema);
module.exports = userMembership;
