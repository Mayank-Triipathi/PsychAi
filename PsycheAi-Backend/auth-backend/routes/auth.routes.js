const express = require("express");
const router  = express.Router();

const userCtrl     = require("../controllers/userAuth.controller");
const adminCtrl    = require("../controllers/adminAuth.controller");
const hospitalCtrl = require("../controllers/hospitalAuth.controller");
const doctorCtrl   = require("../controllers/auth-doctor");

const { authenticate, requireVerified } = require("../middleware/auth");

// ─── User ─────────────────────────────────────────────────────────────────────
router.post("/user/register", userCtrl.register);
router.post("/user/login",    userCtrl.login);
router.get( "/user/me",       authenticate("user"), userCtrl.getProfile);
router.put( "/user/change-password",
  authenticate("user"),
  userCtrl.changePassword
);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.post("/admin/register", adminCtrl.register);
router.post("/admin/login",    adminCtrl.login);
router.get( "/admin/me",       authenticate("admin"), adminCtrl.getProfile);


router.patch(
  "/admin/verify-hospital/:hospital_id",
  authenticate("admin"),
  adminCtrl.verifyHospital
);

router.get(
  "/admin/hospitals",
  authenticate("admin"),
  adminCtrl.getHospitals
);

router.get(
  "/admin/hospital/:hospital_id",
  authenticate("admin"),
  adminCtrl.getHospitalDetails
);

// ─── Hospital ─────────────────────────────────────────────────────────────────
router.post("/hospital/register", hospitalCtrl.register);
router.post("/hospital/login",    hospitalCtrl.login);

router.get(
  "/hospital/me",
  authenticate("hospital"),
  hospitalCtrl.getProfile
);

router.get(
  "/hospital/dashboard",
  authenticate("hospital"),
  requireVerified,
  hospitalCtrl.getProfile
);

router.put(
  "/hospital/change-password",
  authenticate("hospital"),
  hospitalCtrl.changePassword
);

// ─── Doctor ───────────────────────────────────────────────────────────────────
router.post("/doctor/register", doctorCtrl.register);
router.post("/doctor/login",    doctorCtrl.login);

router.get(
  "/doctor/me",
  authenticate("doctor"),
  doctorCtrl.getProfile
);

router.put(
  "/doctor/change-password",
  authenticate("doctor"),
  doctorCtrl.changePassword
);



module.exports = router;