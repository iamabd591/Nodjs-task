const {
  addUser,
  getUsers,
  deleteUser,
} = require("../controllers/user_controller");
const express = require("express");
const userRouter = express.Router();

// api
userRouter
  .post("/add-user", addUser)
  .get("/get-users", getUsers)
  .get("/delete-user", deleteUser);

module.exports = userRouter;
