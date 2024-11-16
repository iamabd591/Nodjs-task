const mongoose = require("mongoose");

const minningUser = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  minningCoins: {
    type: Number,
    default: 0,
  },
  isDailyReward: {
    type: Boolean,
    default: false,
  },
  dailyRewardTime: {
    type: Date,
    default: null,
  },
  minigStartTime: {
    type: Date,
    default: null,
  },
  minigEndTime: {
    type: Date,
    default: null,
  },
  rewardLogin: {
    type: Boolean,
    default: false,
  },
});

const Maining = mongoose.model("Maining", minningUser);
module.exports = Maining;
