const jwt = require("jsonwebtoken");

const SECRETS = {
  user:     process.env.JWT_USER_SECRET,
  admin:    process.env.JWT_ADMIN_SECRET,
  hospital: process.env.JWT_HOSPITAL_SECRET,
  doctor:   process.env.JWT_DOCTOR_SECRET,
};

const generateToken = (payload, type) => {
  const secret = SECRETS[type];
  if (!secret) throw new Error(`Unknown token type: ${type}`);
  return jwt.sign({ ...payload, type }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const verifyToken = (token, type) => {
  const secret = SECRETS[type];
  if (!secret) throw new Error(`Unknown token type: ${type}`);
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };