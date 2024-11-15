const moment = require("moment");
const bcryptjs = require("bcryptjs");
const validator = require("validator");
const User = require("../models/userModel");
const Setting = require("../models/setting");
const Maining = require("../models/miningModel");
const userMembership = require("../models/membership");
const purchaseMembership = require("../models/purchaseMembership");

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
      role: "user",
      userMembership: "Free",
      memberShipStartDate: Date.now(),
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
    const newSetting = await Setting.findOne();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!newSetting || !newSetting.totalMiningTime) {
      return res
        .status(500)
        .json({ message: "Mining settings not configured properly" });
    }

    const userSession = await Maining.findOne({ userId });

    const startTime = new Date();

    const endTime = new Date(
      startTime.getTime() + newSetting.totalMiningTime * 1000
    );

    console.log("Calculated endTime:", endTime);

    if (userSession && startTime <= new Date(userSession.minigEndTime)) {
      return res.status(200).json({
        message: "Mining already in progress.",
        userId: user._id,
        startMinning: userSession.minigStartTime,
        endMinning: userSession.minigEndTime,
      });
    }

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
  const newSetting = await Setting.findOne();
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
    const currentTime = Math.floor(Date.now() / 1000);
    let elapsedSeconds =
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
      miningUser.minningCoins = Math.floor(
        elapsedSeconds * newSetting.coinsPerSeconds
      );
      miningUser.minigStartTime = 0;
      miningUser.minigEndTime = 0;

      await miningUser.save();
      return res.status(200).json({
        message: `Mining session ended for user: ${userId}. Coins earned: ${miningUser.minningCoins}`,
      });
    }

    miningUser.minningCoins = Math.floor(
      elapsedSeconds * newSetting.coinsPerSeconds
    );
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
  console.log(userId);
  console.log(coinsPerSeconds);
  console.log(totalMiningTime);
  if (!userId || !coinsPerSeconds || !totalMiningTime) {
    return res.status(400).json({ message: "All fileds are required" });
  }
  if (userId) {
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(404).json({ message: "Only Admin Can Change Setting" });
    }
  }
  if (!coinsPerSeconds || !totalMiningTime) {
    return res
      .status(400)
      .json({ message: "At least one field is required to make changes" });
  }
  try {
    const miningTime = totalMiningTime * 60 * 60;
    const newSetting = new Setting({
      coinsPerSeconds,
      totalMiningTime: miningTime,
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

const createAndUpdateMembership = async (req, res) => {
  const {
    name,
    price,
    duration,
    minningTime,
    description,
    membershipId,
    coinsPerSeconds,
  } = req.body;

  if (!membershipId) {
    if (
      !name ||
      !price ||
      !description ||
      !minningTime ||
      !coinsPerSeconds ||
      duration == null
    ) {
      return res.status(400).json({
        message:
          "All fields (name, description, price, duration,minningTime, coinsPerSeconds) are required.",
      });
    }

    if (duration < 0 || coinsPerSeconds < 0 || minningTime < 0) {
      return res.status(400).json({
        message:
          "Duration , Coins Per Seconds and Minning Time must be a positive value.",
      });
    }

    try {
      const newMembership = new userMembership({
        name,
        price,
        duration,
        description,
        minningTime,
        coinsPerSeconds,
      });
      await newMembership.save();
      return res
        .status(201)
        .json({ message: "Membership created successfully." });
    } catch (error) {
      return res.status(500).json({
        message: "Server error while creating membership.",
        error: error.message,
      });
    }
  }

  if (
    (!name && !description && !price && duration == null) ||
    !coinsPerSeconds ||
    !minningTime
  ) {
    return res.status(400).json({
      message:
        "At least one field (name, description, price, duration) is required for update.",
    });
  }

  try {
    const membership = await userMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        message: `Membership not found with ID: ${membershipId}`,
      });
    }

    if (name) membership.name = name;
    if (price) membership.price = price;
    if (duration != null) membership.duration = duration;
    if (minningTime) membership.minningTime = minningTime;
    if (description) membership.description = description;
    if (coinsPerSeconds) membership.coinsPerSeconds = coinsPerSeconds;

    membership.updateAt = Date.now();
    await membership.save();

    return res
      .status(200)
      .json({ message: "Membership updated successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating membership.",
      error: error.message,
    });
  }
};

const purchaseMembership = async (req, res) => {
  const {
    userId,
    email,
    cardNumber,
    securityCode,
    membershipId,
    cardValidDate,
  } = req.body;

  if (
    !email ||
    !cardNumber ||
    !securityCode ||
    !cardValidDate ||
    !userId ||
    !membershipId
  ) {
    return res.status(400).json({
      message:
        "All fields (email, cardNumber, securityCode, cardValidDate, userId, membershipId) are required to purchase membership.",
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (!/^\d{16}$/.test(cardNumber)) {
    return res
      .status(400)
      .json({ message: "Card number must be exactly 16 digits." });
  }

  if (!/^\d{3,4}$/.test(securityCode)) {
    return res
      .status(400)
      .json({ message: "Security code must be 3 or 4 digits." });
  }

  const [month, year] = cardValidDate.split("/").map(Number);
  if (
    isNaN(month) ||
    isNaN(year) ||
    month < 1 ||
    month > 12 ||
    new Date(`20${year}`, month - 1) < new Date()
  ) {
    return res
      .status(400)
      .json({ message: "Card expiration date is invalid or expired." });
  }

  try {
    const membership = await userMembership.findById(membershipId);
    const user = await User.findById(userId);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found." });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.userMembership = membership.name;
    user.memberShipEndDate = new Date(
      Date.now() + membership.duration * 24 * 60 * 60 * 1000
    );

    await user.save();

    return res.status(200).json({
      message: "Membership purchased successfully.",
      user: {
        userId: user._id,
        membership: user.userMembership,
        startDate: user.memberShipStartDate,
        endDate: user.memberShipEndDate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while purchasing membership.",
      error: error.message,
    });
  }
};

// const adminRegistration = async (req, res) => {};

module.exports = {
  signIn,
  signUp,
  settings,
  resetEmail,
  deleteUser,
  updateCoins,
  resetPassword,
  startMinningTime,
  adminRegistration,
  purchaseMembership,
  createAndUpdateMembership,
};
