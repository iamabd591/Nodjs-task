const mongoose = require("mongoose");

const mainingSchema = new mongoose.Schema({
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

const Maining = mongoose.model("Maining", mainingSchema);
module.exports = Maining;
