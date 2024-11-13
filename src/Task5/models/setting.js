const mongoose = require("mongoose");
const setting = new mongoose.Schema({
  coinsPerSeconds: {
    type: Number,
    required: true,
  },
  totalMiningTime: {
    type: Number,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
});

const miningSetting = mongoose.model("miningSetting", setting);
module.exports = miningSetting;
