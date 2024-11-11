const mongoose = require("mongoose");

const minningUser = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  minningCoins: {
    type: Number,
    default: 0,
  },
  minigStartTime: {
    type: Date,
    default: null,
  },
  minigEndTime: {
    type: Date,
    default: null,
  },
});

const Maining = mongoose.model("Maining", minningUser);
module.exports = Maining;
