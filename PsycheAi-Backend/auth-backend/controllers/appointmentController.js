const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const { getAvailableSlots } = require("../utils/getAvailableSlots");

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, hospitalId, date, slot, day } = req.body;
    const { userId } = req.body;

    const doctor = await Doctor.findById(doctorId);
    const hospital = await Hospital.findById(hospitalId);

    if (!doctor || !hospital) {
      return res.status(404).json({ message: "Invalid data" });
    }

    // 🔹 Check slot availability
    const slots = await getAvailableSlots(doctor, date, day);

    if (!slots.includes(slot)) {
      return res.status(400).json({ message: "Slot not available" });
    }

    // 🔹 Booking type logic 
    let status = "pending";

    if (hospital.bookingType === "AUTO") {
      status = "confirmed";
    }

    // 🔹 Create appointment
 const appointment = await Appointment.create({
  user: userId,
  doctor: doctorId,
  hospital: hospitalId,
  date,
  slot
});

    res.json({
      message:
        status === "confirmed"
          ? "Appointment confirmed"
          : "Appointment request sent",
      appointment
    });

  } catch (err) {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
}
};
const getHospitalAppointments = async (req, res) => {
  const appointments = await Appointment.find({
    hospital: req.hospital._id
  })
  .populate("doctor")
  .populate("user");

  res.json(appointments);
};

const getDoctorAppointments = async (req, res) => {
  const appointments = await Appointment.find({
    doctor: req.doctor._id
  })
  .populate("user");

  res.json(appointments);
};

const getUserAppointments = async (req, res) => {
  const appointments = await Appointment.find({
    user: req.user._id
  })
  .populate("doctor")
  .populate("hospital");

  res.json(appointments);
};

module.exports = { bookAppointment, getHospitalAppointments, getDoctorAppointments, getUserAppointments };