const Hospital = require("../models/Hospital");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");

const register = async (req, res) => {
  try {
    const { name,email,password, address, lat, lng } = req.body;

    const hospital = await Hospital.create({
      name,
      email,
      password,
      address,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    });

    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const hospital = await Hospital
      .findOne({ email })
      .select("+password");

    if (!hospital) return error(res, "Invalid email or password", 401);

    const isMatch = hospital.password === password;
    if (!isMatch) return error(res, "Invalid email or password", 401);

    const token = generateToken(
      { id: hospital._id, email: hospital.email },
      "hospital"
    );

    hospital.password = undefined;

    return success(res, { hospital, token }, "Login successful");

  } catch (err) {
    console.error("[hospital:login]", err);
    return error(res, "Login failed");
  }
};

const getProfile = async (req, res) => {
  return success(res, { hospital: req.hospital }, "Profile fetched");
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const hospital = await Hospital.findById(req.hospital._id).select("+password");
    const isMatch = await hospital.comparePassword(currentPassword);
    if (!isMatch) return error(res, "Current password is incorrect", 400);

    hospital.password = newPassword;
    await hospital.save();

    return success(res, null, "Password changed successfully");
  } catch (err) {
    console.error("[hospital:changePassword]", err);
    return error(res, "Failed to change password");
  }
};

module.exports = { register, login, getProfile, changePassword };