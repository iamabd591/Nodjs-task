const mongoose = require("mongoose");
const membershiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
  },
  descriprion: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
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
    default: Date.now(),
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
});

const userMembership = mongoose.model("membership", membershiSchema);
module.exports = userMembership;
