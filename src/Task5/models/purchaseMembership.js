const mongoose = require("mongoose");
const purchaseMembership = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  cardNumber: {
    type: Number,
    required: true,
    minlenght: 16,
  },
  securityCode: {
    type: Number,
    required: true,
    minlenght: 3,
    maxlenght: 4,
  },
  cardValidDate: {
    type: Date,
    required: true,
  },
});
const purchaseMembershipSchema = mongoose.model(
  "purchaseMembership",
  purchaseMembership
);
module.exports = purchaseMembershipSchema;
