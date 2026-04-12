const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");

const register = async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return error(res, "Email already registered", 409);

    const user = await User.create({
      name,
      email,
      phone,
      password,
      location: {
        lat: latitude,
        lng: longitude
      }
    });
    const token = generateToken({ id: user._id, email: user.email }, "user");

    return success(res, { user, token }, "Registration successful", 201);
  } catch (err) {
    console.error("[user:register]", err);
    return error(res, "Registration failed");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since it's excluded by default (select: false)
    const user = await User.findOne({ email }).select("+password");
    if (!user) return error(res, "Invalid email or password", 401);

    const isMatch = password === user.password;
    if (!isMatch) return error(res, "Invalid email or password", 401);

    const token = generateToken({ id: user._id, email: user.email }, "user");

    // Strip password before sending
    user.password = undefined;
    return success(res, { user, token }, "Login successful");
  } catch (err) {
    console.error("[user:login]", err);
    return error(res, "Login failed");
  }
};

const getProfile = async (req, res) => {
  return success(res, { user: req.user }, "Profile fetched");
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return error(res, "Current password is incorrect", 400);

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return success(res, null, "Password changed successfully");
  } catch (err) {
    console.error("[user:changePassword]", err);
    return error(res, "Failed to change password");
  }
};

module.exports = { register, login, getProfile, changePassword };