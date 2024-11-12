const moment = require("moment");
const bcryptjs = require("bcryptjs");
const validator = require("validator");
const User = require("../models/userModel");
const Maining = require("../models/miningModel");
const Setting = require("../models/setting");

const signUp = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, Email, and Password are required to register a user.",
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email format is not correct" });
  }
  const existUser = await User.findOne({ email });
  if (existUser) {
    return res.status(400).json({ message: "This email is already in use." });
  }

  try {
    const hashPassword = await bcryptjs.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      role: role || "user",
    });
    await newUser.save();
    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and Password are required to sign in." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password." });
    }

    const { password: _, ...userData } = user.toObject();

    return res.status(200).json({
      message: "Login successful.",
      userData,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

const resetEmail = async (req, res) => {
  const { userId, oldEmail, newEmail, password } = req.body;

  if (!userId || !oldEmail || !newEmail || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required to reset email." });
  }

  if (!validator.isEmail(oldEmail) || !validator.isEmail(newEmail)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.email !== oldEmail) {
      return res
        .status(400)
        .json({ message: `${oldEmail} email is not found` });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    user.email = newEmail;
    await user.save();

    return res.status(200).json({ message: "Email reset successfully." });
  } catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

const resetPassword = async (req, res) => {
  const { userId, email, newPassword } = req.body;

  if (!userId || !email || !newPassword) {
    return res
      .status(400)
      .json({ message: "User ID, email, and new password are required." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.email !== email) {
      return res.status(400).json({
        message: "Email does not match the registered email for this user.",
      });
    }

    const newHashPassword = await bcryptjs.hash(newPassword, 10);
    user.password = newHashPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

const deleteUser = async (req, res) => {
  if (!req.params.id) {
    return res
      .status(400)
      .json({ message: "Invalid URL. User ID is required." });
  }

  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const startMinningTime = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userSession = await Maining.findOne({ userId });
    const startTime = new Date().getTime();
    let endTime = new Date(userSession.minigEndTime).getTime();

    if (startTime <= endTime) {
      return res.status(200).json({
        message: "Mining already in progress.",
        userId: user._id,
        startMinning: userSession.minigStartTime,
        endMinning: userSession.minigEndTime,
      });
    }

    endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    const newMiningUser = await Maining.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        minningCoins: 0,
        minigStartTime: startTime,
        minigEndTime: endTime,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Mining session started successfully.",
      userId: user._id,
      startMinning: newMiningUser.minigStartTime,
      endMinning: newMiningUser.minigEndTime,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const updateCoins = async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res
      .status(400)
      .json({ message: "Invalid URL. User ID is required." });
  }

  const user = await User.findById(userId);
  const miningUser = await Maining.findOne({ userId });

  if (!user || !miningUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!miningUser.minigStartTime || !miningUser.minigEndTime) {
    miningUser.minningCoins = 0;
    await miningUser.save();
    return res.status(400).json({ message: "Your mining is not started yet." });
  }

  try {
    const currentTime = Math.floor(Date.now() / 1000); // Convert current time to seconds
    const elapsedSeconds =
      currentTime - Math.floor(miningUser.minigStartTime / 1000);

    if (elapsedSeconds < 0) {
      return res.status(400).json({
        message: "Error in Calculating Coins.",
      });
    }
    if (currentTime >= Math.floor(miningUser.minigEndTime / 1000)) {
      elapsedSeconds = Math.floor(
        (miningUser.minigStartTime - miningUser.minigEndTime) / 1000
      );
      miningUser.minningCoins = elapsedSeconds;
      miningUser.minigStartTime = 0;
      miningUser.minigEndTime = 0;

      await miningUser.save();
      return res.status(200).json({
        message: `Mining session ended for user: ${userId}. Coins earned: ${miningUser.minningCoins}`,
      });
    }

    miningUser.minningCoins = elapsedSeconds;
    await miningUser.save();

    return res.status(200).json({
      message: `User ${user.name} has earned ${miningUser.minningCoins} mining coins.`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const settings = async (req, res) => {
  const { userId, coinsPerSeconds, totalMiningTime } = req.body;
  if (!userId) {
    const user = await User.findById(userId);
    if (!user && !user.role === "admin") {
      return res.status(404).json({ message: "Only Admin Can Change Setting" });
    }
  }
  if (!coinsPerSeconds || !totalMiningTime) {
    return res
      .status(400)
      .json({ message: "At least one field is required to make changes" });
  }
  try {
    const newSetting = new Setting({
      coinsPerSeconds,
      totalMiningTime,
      createdBy: userId,
    });
    await newSetting.save();
    return res.status(200).json({ message: "Settings saved successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  signIn,
  signUp,
  settings,
  deleteUser,
  resetEmail,
  updateCoins,
  resetPassword,
  startMinningTime,
};
