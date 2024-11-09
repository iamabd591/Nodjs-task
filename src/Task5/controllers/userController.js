const bcryptjs = require("bcryptjs");
const validator = require("validator");
const User = require("../models/userModel");
const Maining = require("../models/miningModel");

const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are required to register a user." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email format is not correct" });
  }

  try {
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const hashPassword = await bcryptjs.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashPassword,
    });

    const newMiningUser = new Maining({
      userId: newUser._id,
      numberofCoins: 0,
    });

    await Promise.all([newUser.save(), newMiningUser.save()]);

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      mining: newMiningUser,
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

  const user = await User.findById(userId);
  const miningUser = await Maining.findOne({ userId });

  if (!user || !miningUser) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const startTime = Math.floor(Date.now() / 1000);
    const maxMiningDurationInSeconds = 24 * 60 * 60;

    miningUser.minigStartTime = startTime;
    miningUser.minigEndTime = startTime + maxMiningDurationInSeconds;

    await miningUser.save();
    return res.status(200).json({
      message: "Mining session started successfully.",
      userId: user._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const updateCoins = async (req, res) => {
  const { userId } = req.params;
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
    miningUser.numberofCoins = 0;
    await miningUser.save();
    return res.status(400).json({ message: "Mining has not started." });
  }

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const elapsedSeconds = currentTime - miningUser.minigStartTime;

    if (currentTime >= miningUser.minigEndTime) {
      miningUser.numberofCoins = elapsedSeconds;
      miningUser.minigStartTime = 0;
      miningUser.minigEndTime = 0;

      await miningUser.save();

      return res.status(200).json({
        message: `Mining session ended for user: ${userId}. Coins earned: ${miningUser.numberofCoins}`,
      });
    }

    miningUser.numberofCoins = elapsedSeconds;
    await miningUser.save();

    return res.status(200).json({
      message: `User ${user.name} has earned ${miningUser.numberofCoins} mining coins.`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  signIn,
  signUp,
  deleteUser,
  resetEmail,
  updateCoins,
  resetPassword,
  startMinningTime,
};
