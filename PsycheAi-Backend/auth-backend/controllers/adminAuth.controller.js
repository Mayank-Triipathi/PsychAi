const Admin = require("../models/Admin");
const Hospital = require("../models/Hospital");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) return error(res, "Email already registered", 409);

    const admin = await Admin.create({ name, email, password });
    const token = generateToken({ id: admin._id, email: admin.email }, "admin");
    admin.password = undefined;

    return success(res, { admin, token }, "Admin registered", 201);
  } catch (err) {
    console.error("[admin:register]", err);
    return error(res, "Registration failed");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return error(res, "Invalid email or password", 401);

    const isMatch = admin.password === password;
    if (!isMatch) return error(res, "Invalid email or password", 401);

    const token = generateToken(
      { id: admin._id, email: admin.email },
      "admin"
    );

    admin.password = undefined;
    return success(res, { admin, token }, "Login successful");

  } catch (err) {
    console.error("[admin:login]", err);
    return error(res, "Login failed");
  }
};

const getProfile = async (req, res) => {
  return success(res, { admin: req.admin }, "Profile fetched");
};

// Admin verifies a hospital so it can access protected routes
const verifyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospital_id);
    if (!hospital) return error(res, "Hospital not found", 404);
    if (hospital.is_verified) return error(res, "Hospital is already verified", 400);
    
    hospital.verified = true;
    hospital.admin = req.admin._id;
    await hospital.save();

    return success(res, { hospital }, "Hospital verified successfully");
  } catch (err) {
    console.error("[admin:verifyHospital]", err);
    return error(res, "Verification failed");
  }
};

const getHospitals = async (req, res) => {
  try {
    const { verified } = req.query;

    const filter = {};
    if (verified !== undefined) {
      filter.verified = verified === "true";
    }

    const hospitals = await Hospital.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return success(res, { hospitals }, "Hospitals fetched");
  } catch (err) {
    console.error("[admin:getHospitals]", err);
    return error(res, "Failed to fetch hospitals");
  }
};
const getHospitalDetails = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospital_id);

    if (!hospital) {
      return error(res, "Hospital not found", 404);
    }

    return success(res, { hospital }, "Hospital details fetched");
  } catch (err) {
    console.error(err);
    return error(res, "Failed to fetch hospital");
  }
};
module.exports = { register, login, getProfile, verifyHospital, getHospitals, getHospitalDetails  };