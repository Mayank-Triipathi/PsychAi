const Doctor = require("../models/Doctor");
const { getAvailableSlots } = require("../utils/getAvailableSlots");

const getSlots = async (req, res) => {
  try {
    const { doctorId, date, day } = req.body;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const slots = await getAvailableSlots(doctor, date, day);

    res.json({ slots });

  } catch (err) {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
}
};

module.exports = { getSlots };