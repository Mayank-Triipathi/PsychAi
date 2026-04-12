const { verifyToken } = require("../utils/jwt");
const { error } = require("../utils/response");
const User     = require("../models/User");
const Admin    = require("../models/Admin");
const Hospital = require("../models/Hospital");
const Doctor   = require("../models/Doctor");
const hospital = require("../models/Hospital");

const MODELS = { user: User, admin: Admin, hospital: Hospital, doctor: Doctor, hospital: hospital };

const authenticate = (type) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return error(res, "Authorization token missing", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token, type);

    const Model = MODELS[type];
    const entity = await Model.findById(decoded.id);
    if (!entity) return error(res, "Account no longer exists", 401);

    req[type] = entity;   // e.g. req.user, req.admin, req.hospital
    req.authType = type;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return error(res, "Token expired, please login again", 401);
    if (err.name === "JsonWebTokenError")  return error(res, "Invalid token", 401);
    console.error(`[authenticate:${type}]`, err);
    return error(res, "Authentication failed", 500);
  }
};

// Stack after authenticate('hospital') to gate unverified hospitals
const requireVerified = (req, res, next) => {
  if (!req.hospital?.is_verified) {
    return error(res, "Hospital account is not yet verified by an admin", 403);
  }
  next();
};

module.exports = { authenticate, requireVerified };