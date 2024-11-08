const userRouter = require("./router/user_router");
const connectDb = require("./database/mongodb");
const express = require("express");
const dotenv = require("dotenv");
const app = express();

dotenv.config();
app.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on port:", 3000);
  connectDb()
    .then(() => console.log("Database Connected"))
    .catch((e) => console.log("Error", e));
});

app.get("/", (req, res) => res.send("<h1>Hello World</h1>"));

// ----- Middlewares
app.use(express.json());
app.use("/api/user", userRouter);
