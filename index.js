const express = require("express");
require("dotenv").config(); // Make sure to execute dotenv.config()
const userRouter = require("./src/Task5/router/router");
const connectdb = require("./src/Task5/database/mongodb");
const app = express();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(userRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  connectdb()
    .then(() => console.log("Database Connected"))
    .catch((e) => console.log(`Error in connecting to db ${e.message}`));
});
