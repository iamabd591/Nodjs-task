const bcryptjs = require("bcryptjs");
const User = require("../models/user_model");

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const hash = await bcryptjs.hash(password, 8);
    const newUser = await User.create({
      password: hash,
      email,
      name,
    });

    res.status(200).json({ user: newUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getUsers, addUser, deleteUser };
