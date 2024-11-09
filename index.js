// const app = require("./src/Task4/app")
const express = require("express");
const dotenv = require("dotenv").config;
const userRouter = require("./src/Task5/router/router");
const connectdb = require("./src/Task5/database/mongodb");
const app = express();

const PORT = process.env.PORT || 4000;
app.listen(3002, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  connectdb()
    .then(() => console.log("Database Connected"))
    .catch((e) => console.log(`Error in connecting to db ${e.message}`));
});
app.use(express.json());
app.use(userRouter);

// app.listen(PORT, () => {
//   console.log(`Server is listening on PORT ${PORT}`);
// });
