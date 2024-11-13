const {
  signIn,
  signUp,
  settings,
  resetEmail,
  deleteUser,
  updateCoins,
  resetPassword,
  startMinningTime,
  createAndUpdateMembership,
  purchaseMembership,
  adminRegistration,
} = require("../controllers/userController");
const express = require("express");
const userRouter = express.Router();

userRouter
  .post("/api/signUp", signUp)
  .post("/api/signIn", signIn)
  .post("/api/resetEmail", resetEmail)
  .post("/api/minningSettings", settings)
  .get("/api/updateCoins/:id", updateCoins)
  .post("/api/resetPassword", resetPassword)
  .delete("/api/deleteUser/:id", deleteUser)
  .post("/api/startMinning", startMinningTime)
  .post("/api/adminRegistration", adminRegistration)
  .post("/api/purchaseMembership", purchaseMembership)
  .post("/api/createAndUpdateMembership", createAndUpdateMembership);

module.exports = userRouter;
