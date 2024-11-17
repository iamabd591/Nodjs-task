const {
  signIn,
  signUp,
  settings,
  verifyOtp,
  resetEmail,
  deleteUser,
  updateCoins,
  resetPassword,
  startMinningTime,
  deleteMembership,
  getAllMemberships,
  adminRegistration,
  userPurchaseMembership,
  createAndUpdateMembership,
} = require("../controllers/userController");
const express = require("express");
const userRouter = express.Router();

userRouter
  .post("/api/signUp", signUp)
  .post("/api/signIn", signIn)
  .post("/api/verifyOTP", verifyOtp)
  .post("/api/resetEmail", resetEmail)
  .post("/api/minningSettings", settings)
  .get("/api/updateCoins/:id", updateCoins)
  .post("/api/resetPassword", resetPassword)
  .delete("/api/deleteUser/:id", deleteUser)
  .post("/api/startMinning", startMinningTime)
  .get("/api/getAllMembership", getAllMemberships)
  .post("/api/adminRegistration", adminRegistration)
  .delete("/api/deleteMembership/:id", deleteMembership)
  .post("/api/purchaseMembership", userPurchaseMembership)
  .post("/api/createAndUpdateMembership", createAndUpdateMembership);

module.exports = userRouter;
