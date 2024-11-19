const fs = require("fs");
const crypto = require("crypto");
const moment = require("moment");
const bcryptjs = require("bcryptjs");
const validator = require("validator");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const Setting = require("../models/setting");
const Maining = require("../models/miningModel");
const userMembership = require("../models/membership");
const purchaseMembership = require("../models/purchaseMembership");
const { saveOtpWithRegeneration, otpCache } = require("../../../utils");

/* Node Mailer*/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

/* Pagination API */
const getAllUser = async (req, res) => {
  console.log("pagination");
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page <= 0 || limit <= 0) {
      return res.status(400).json({
        message: "Page and limit must be positive integers.",
      });
    }

    const skip = (page - 1) * limit;
    const totalItems = await User.countDocuments();
    const userData = await User.find().skip(skip).limit(limit);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      totalItems,
      page,
      limit,
      totalPages,
      data: userData,
    });
  } catch (error) {
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

/* Sign up API */
const signUp = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, Email, and Password are required to register a user.",
    });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }
  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long.",
    });
  }
  if (["admin", "Admin"].includes(role)) {
    return res.status(400).json({
      message: "Registration as 'admin' is not allowed.",
    });
  }

  try {
    const restrictedEmails = ["admin@gmail.com"];
    if (restrictedEmails.includes(email.toLowerCase())) {
      return res.status(400).json({
        message: "This email is not allowed for registration.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({
      name,
      email,
      role: "user",
      isVerified: false,
      password: hashPassword,
      userMembership: "Free",
      memberShipEndDate: null,
      memberShipStartDate: new Date(),
    });
    await newUser.save();

    const newMiningUser = new Maining({
      miningCoins: 0,
      rewardLogin: false,
      userId: newUser._id,
      miningEndTime: null,
      isDailyReward: false,
      dailyRewardTime: null,
      miningStartTime: null,
    });
    await newMiningUser.save();
    saveOtpWithRegeneration(email);
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return res.status(201).json({
      message: "User registered successfully. Please verify your account.",
      user: userWithoutPassword,
      miningUser: newMiningUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

/* Verify OTP API */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ message: "Both email and OTP are required." });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otpData = otpCache.get(email);
    if (!otpData) {
      return res
        .status(400)
        .json({ message: "OTP has expired or is invalid." });
    }
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.isVerified = true;
    await user.save();
    otpCache.delete(email);

    return res.status(200).json({ message: "User verified successfully." });
  } catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

/*Sign In API */
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

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password lenght should be 8 character long." });
  }

  try {
    const user = await User.findOne({ email }).populate("membershipId");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password." });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account to login" });
    }

    let userMinning = await Maining.findOne({ userId: user._id });
    if (userMinning) {
      const currentDate = new Date();
      const lastRewardTime = userMinning.dailyRewardTime;

      if (
        !lastRewardTime ||
        currentDate - new Date(lastRewardTime) >= 24 * 60 * 60 * 1000
      ) {
        const membership = user.userMembership.toLowerCase();
        console.log(membership);
        const membershipDetails = await userMembership.findOne({
          name: membership,
        });
        console.log(membershipDetails);
        const dailyReward = membershipDetails.dailyRewardCoins;

        userMinning.minningCoins += dailyReward;
        userMinning.dailyRewardTime = currentDate;
        userMinning.isDailyReward = true;
        userMinning.rewardLogin = true;
        await userMinning.save();
        return res.status(200).json({
          message: "Login successful. Daily reward applied.",
          dailyReward: userMinning.isDailyReward ? userMinning.minningCoins : 0,
        });
      } else {
        userMinning.isDailyReward = false;
      }
      const { password: _, ...userData } = user.toObject();
      return res.status(200).json({
        message: "Login successful.",
        userData,
        dailyReward: userMinning.isDailyReward ? userMinning.minningCoins : 0,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
    });
  }
};

/* Reset Email API*/
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

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account to reset email" });
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

/* Reset Password API*/
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

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account to reset password" });
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

/* Delete User API*/
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

/* Start Minning API*/
const startMinningTime = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId).populate("membershipId");
    // console.log(user);
    const minningUser = await Maining.findOne({ userId: userId });

    if (!user || !minningUser) {
      return res.status(404).json({ message: "User or mining data not found" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account to start minning" });
    }

    const membership = user.userMembership.toLowerCase();
    // console.log("Membership:", membership);

    if (!membership) {
      return res
        .status(400)
        .json({ message: "User does not have an active membership." });
    }

    const membershipDetails = await userMembership.findOne({
      name: membership,
    });

    if (!membershipDetails) {
      return res.status(404).json({ message: "Membership details not found" });
    }

    // console.log("Membership Details:", membershipDetails);
    // const userSession = await Maining.findById(userId);
    // console.log(userSession);

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + membershipDetails.minningTime * 1000
    );

    console.log("Start Time:", startTime);
    console.log("End Time:", endTime);

    // Check if mining is already in progress
    if (minningUser.minigStartTime && minningUser.minigEndTime) {
      return res.status(400).json({
        message: "User Mining is already started",
        startTime: minningUser.minigStartTime,
        endTime: minningUser.minigEndTime,
      });
    }

    const currentTime = new Date().getTime();

    // Check if mining has already ended
    if (currentTime >= minningUser.minigEndTime) {
      minningUser.minigStartTime = 0;
      minningUser.minigEndTime = 0;
      return res.status(400).json({
        message: "User Mining has already ended",
        startTime: minningUser.minigStartTime,
        endTime: minningUser.minigEndTime,
      });
    }

    // Update mining start and end time
    minningUser.minigStartTime = startTime;
    minningUser.minigEndTime = endTime;
    await minningUser.save();

    return res.status(201).json({
      message: "Mining started successfully",
      startTime: minningUser.minigStartTime,
      endTime: minningUser.minigEndTime,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/* Update Coins API*/
const updateCoins = async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res
      .status(400)
      .json({ message: "Invalid URL. User ID is required." });
  }

  const user = await User.findById(userId).populate("membershipId");
  const minningUser = await Maining.findOne({ userId: userId });

  if (!user || !minningUser) {
    return res.status(404).json({ message: "User or mining data not found" });
  }

  if (!user.isVerified) {
    return res
      .status(400)
      .json({ message: "Please verify your account to check your coins" });
  }
  const membership = user.userMembership.toLowerCase();

  if (!membership) {
    return res
      .status(400)
      .json({ message: "User does not have an active membership." });
  }

  const membershipDetails = await userMembership.findOne({
    name: membership,
  });

  if (!membershipDetails) {
    return res.status(404).json({ message: "Membership details not found" });
  }

  if (!minningUser.minigStartTime || !minningUser.minigEndTime) {
    // minningUser.minningCoins = 0;
    await minningUser.save();
    return res.status(400).json({
      message: `Currently your mining is not running.Your Current Coins: ${minningUser.minningCoins} `,
    });
  }

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    let elapsedSeconds =
      currentTime - Math.floor(minningUser.minigStartTime / 1000);

    if (elapsedSeconds < 0) {
      return res.status(400).json({
        message: "Error in Calculating Coins.",
      });
    }

    if (currentTime >= Math.floor(minningUser.minigEndTime / 1000)) {
      elapsedSeconds = Math.floor(
        (minningUser.minigEndTime - minningUser.minigStartTime) / 1000
      );

      minningUser.minningCoins = Math.floor(
        elapsedSeconds * membershipDetails.coinsPerSeconds
      );
      minningUser.minigStartTime = 0;
      minningUser.minigEndTime = 0;

      await minningUser.save();
      return res.status(200).json({
        message: `Mining session ended for user: ${userId}. Coins earned: ${minningUser.minningCoins}`,
      });
    }

    minningUser.minningCoins =
      elapsedSeconds * membershipDetails.coinsPerSeconds;
    await minningUser.save();

    return res.status(200).json({
      message: `User ${user.name} has earned ${minningUser.minningCoins} mining coins. Start Time is ${minningUser.minigStartTime} End Time is ${minningUser.minigEndTime}`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/* Setting API*/
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
      adminId: userId,
    });
    await newSetting.save();
    return res.status(200).json({ message: "Settings saved successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/* Create and Update Membership API*/

const createAndUpdateMembership = async (req, res) => {
  const {
    name,
    price,
    adminId,
    duration,
    minningTime,
    description,
    membershipId,
    coinsPerSeconds,
    dailyRewardCoins,
  } = req.body;

  if (adminId) {
    const isAdmin = await User.findById(adminId);
    if (!isAdmin || isAdmin.role.toLowerCase() !== "admin") {
      return res
        .status(404)
        .json({ message: "Only Admin Can Do CRUD Opreation" });
    }
  }

  try {
    if (!membershipId) {
      if (
        !name ||
        !description ||
        !minningTime ||
        !coinsPerSeconds ||
        !dailyRewardCoins
      ) {
        return res.status(400).json({
          message:
            "Fields (Name, Description, Minning Time, Coins Per Seconds, Daily Minning Coins) are required. For non-free memberships, price and duration are also required.",
        });
      }

      const isFreeMembership = name.toLowerCase() === "free";
      if (!isFreeMembership) {
        if (!price || typeof duration !== "number") {
          return res.status(400).json({
            message:
              "For non-free memberships, price and duration are required.",
          });
        }

        if (
          price <= 0 ||
          duration <= 0 ||
          minningTime <= 0 ||
          coinsPerSeconds <= 0 ||
          dailyRewardCoins <= 0
        ) {
          return res.status(400).json({
            message:
              "Duration, Price, Coins Per Seconds, Minning Time and Daily Reward Coins must be greater than zero.",
          });
        }
      } else {
        if (minningTime <= 0 || coinsPerSeconds <= 0 || dailyRewardCoins <= 0) {
          return res.status(400).json({
            message:
              "Free memberships must have valid Minning Time, Coins Per Seconds and Daily Reward values greater than zero.",
          });
        }
      }

      const minningTimeInSeconds = minningTime * 3600;
      const membershipExist = await userMembership.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      if (membershipExist) {
        return res.status(400).json({
          message: `${name} membership already exists. To update, provide the membership ID.`,
        });
      }
      const newMembership = new userMembership({
        name,
        adminId,
        description,
        coinsPerSeconds,
        createdAt: Date.now(),
        minningTime: minningTimeInSeconds,
        dailyRewardCoins: dailyRewardCoins,
        price: isFreeMembership ? "0" : `$${price}`,
        duration: isFreeMembership ? null : duration,
      });
      await newMembership.save();

      return res.status(201).json({
        message: "Membership created successfully.",
        membership: newMembership,
      });
    }

    if (
      !name &&
      !price &&
      !description &&
      !dailyRewardCoins &&
      typeof duration !== "number" &&
      typeof minningTime !== "number" &&
      typeof coinsPerSeconds !== "number"
    ) {
      return res.status(400).json({
        message:
          "At least one field (Name, Description, Price, Duration, Minning Time, Coins Per Seconds, Daily Reward) is required for update.",
      });
    }

    const membership = await userMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        message: `Membership not found with ID: ${membershipId}`,
      });
    }

    if (name) membership.name = name;
    if (price) membership.price = price;
    if (dailyRewardCoins) membership.dailyRewardCoins = dailyRewardCoins;
    if (typeof duration === "number" && duration > 0) {
      membership.duration = duration;
    }
    if (typeof minningTime === "number" && minningTime > 0) {
      membership.minningTime = minningTime * 3600;
    }
    if (description) membership.description = description;
    if (typeof coinsPerSeconds === "number" && coinsPerSeconds > 0) {
      membership.coinsPerSeconds = coinsPerSeconds;
    }

    membership.updateAt = new Date();
    await membership.save();

    return res
      .status(200)
      .json({ message: "Membership updated successfully.", membership });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while processing membership.",
      error: error.message,
    });
  }
};
/* Purchase Membership API*/
const userPurchaseMembership = async (req, res) => {
  const {
    email,
    userId,
    cardNumber,
    securityCode,
    membershipId,
    cardValidDate,
  } = req.body;

  if (
    !email ||
    !userId ||
    !cardNumber ||
    !membershipId ||
    !securityCode ||
    !cardValidDate
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
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account to purchase membership" });
    }

    if (user.userMembership == membership.name) {
      return res
        .status(400)
        .json({ message: "You already have this membership" });
    }
    user.userMembership = membership.name;
    user.memberShipEndDate = new Date(
      Date.now() + membership.duration * 24 * 60 * 60 * 1000
    );

    const newPurchcser = purchaseMembership({
      userId: userId,
      email: email,
      cardNumber: cardNumber,
      securityCode: securityCode,
      cardValidDate: cardValidDate,
    });
    await newPurchcser.save();
    await user.save();
    return res.status(200).json({
      message: "Membership purchased successfully.",
      user: {
        userId: user._id,
        membership: user.userMembership,
        endDate: user.memberShipEndDate,
        startDate: user.memberShipStartDate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while purchasing membership.",
      error: error.message,
    });
  }
};

/* Delete Membership API*/

const deleteMembership = async (req, res) => {
  if (!req.params.id) {
    return res
      .status(400)
      .json({ message: "Invalid URL. Membership ID is required." });
  }

  try {
    const membership = await userMembership.findByIdAndDelete(req.params.id);

    if (!membership) {
      return res.status(404).json({ message: "Membership is not found." });
    }

    return res
      .status(200)
      .json({ message: "Membership deleted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

/* Fetch All Membership API*/
const getAllMemberships = async (req, res) => {
  try {
    const allMemberships = await userMembership.find();
    if (allMemberships.length === 0) {
      return res.status(404).json({ message: "No memberships found." });
    }

    const membershipData = {
      message: "Memberships fetched successfully.",
      allMemberShip: allMemberships,
    };
    const jsonData = JSON.stringify(membershipData, null, 2);
    const filePath = "memberships.json";

    fs.writeFile(filePath, jsonData, (err) => {
      if (err) {
        console.error("Error writing to file", err);
        return res.status(500).json({
          message: "Error writing to JSON file.",
          error: err.message,
        });
      }

      return res.status(200).json(membershipData);
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching memberships.",
      error: error.message,
    });
  }
};

/* Admin Registration API*/

const adminRegistration = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long.",
    });
  }

  if (role.toLowerCase() !== "admin") {
    return res
      .status(400)
      .json({ message: "Only admins can register using this endpoint." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newAdmin = new User({
      name,
      email,
      role: "admin",
      membershipId: null,
      userMembership: null,
      memberShipEndDate: null,
      password: hashedPassword,
      memberShipStartDate: null,
    });

    await newAdmin.save();
    const { password: _, ...adminWithoutPassword } = newAdmin.toObject();

    return res.status(201).json({
      message: "Admin registered successfully.",
      admin: adminWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  signIn,
  signUp,
  settings,
  verifyOtp,
  resetEmail,
  getAllUser,
  deleteUser,
  updateCoins,
  resetPassword,
  startMinningTime,
  deleteMembership,
  getAllMemberships,
  adminRegistration,
  userPurchaseMembership,
  createAndUpdateMembership,
};
