const {
  signIn,
  signUp,
  settings,
  resetEmail,
  deleteUser,
  updateCoins,
  resetPassword,
  startMinningTime,
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
  .post("/api/startMinning", startMinningTime);

module.exports = userRouter;
