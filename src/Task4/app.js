const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./model/model");
const connectDb = require("./Db_Connection/Db_connection");

const app = express();
app.use(express.json());
connectDb().then(() => console.log("Database connected"));

// SignUp Route
app.post("/api/signUp", async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body;
  if (!fullName || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: "All Fileds Are Required" });
  } else {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
        phoneNumber,
      });
      await newUser.save();
      return res
        .status(200)
        .json({ message: "New User Registered Successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server Error", error: error.message });
    }
  }
});

// Login Route
app.post("/api/signIn", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All Fields Are Required" });
  } else {
    try {
      const userExist = await User.findOne({ email });
      if (!userExist) {
        return res.status(404).json({ message: "User Not Found" });
      } else {
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid Password" });
        } else {
          const { password: _, ...userData } = userExist.toObject();
          return res
            .status(200)
            .json({ message: "Login Successfully", userData });
        }
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server Error", error: error.message });
    }
  }
});

// Update Profile
app.put("/api/updateProfile/:id", async (req, res) => {
  const { fullName, email, phoneNumber } = req.body;

  if (!fullName && !email && !phoneNumber) {
    return res
      .status(400)
      .json({ message: "At least one field is required to update profile" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
});

// Delete Api
app.delete("/api/delete/:id", async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ message: "Invalid URL" });
  } else {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      else {
        return res.status(200).json({ message: "User Deleted Successfully" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server Error", error: error.message });
    }
  }
});

module.exports = app;
