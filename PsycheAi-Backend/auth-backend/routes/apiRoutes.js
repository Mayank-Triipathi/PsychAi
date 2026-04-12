const express = require("express");
const router = express.Router();
const StressPrediction = require("../models/StressPrediction");

const { authenticate, requireVerified } = require("../middleware/auth");
const { addDoctor, addDoctors, getDoctors } = require("../controllers/Doctor-hospital");
const { getHospitalAppointments, getDoctorAppointments, getUserAppointments } = require("../controllers/appointmentController");

const { matchDoctor } = require("../controllers/matchController");
const { getSlots } = require("../controllers/slotController");
const { bookAppointment } = require("../controllers/appointmentController");
const { chatAssessment } = require("../controllers/chat-assessment");

router.post("/match-doctor", matchDoctor);
router.post("/get-slots", getSlots);
router.post("/book-appointment", bookAppointment);
router.get("/nearby-hospitals", require("../controllers/nearby-hospitals").nearbyHospitals);
router.post("/chat-assessment", authenticate("user"), chatAssessment);

// router.post("/hospital/add-doctor", authenticate("hospital"), requireVerified, addDoctor);
// router.post("/hospital/add-doctors", authenticate("hospital"), requireVerified, addDoctors);
// router.get("/hospital/doctors", authenticate("hospital"), requireVerified, getDoctors);

router.post("/hospital/add-doctor", authenticate("hospital"), addDoctor);
router.post("/hospital/add-doctors", authenticate("hospital"), addDoctors);
router.get("/hospital/doctors", authenticate("hospital"), getDoctors);

router.post("/create-prediction", async (req, res) => {
  try {
    const prediction = await StressPrediction.create(req.body);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/hospital/appointments",
    authenticate("hospital"),
    getHospitalAppointments
);

router.get("/doctor/appointments",
    authenticate("doctor"),
    getDoctorAppointments
);

router.get("/user/appointments",
    authenticate("user"),
    getUserAppointments
);
module.exports = router;