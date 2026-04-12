const express = require("express");
const router = express.Router();

const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");
// POST /hospital/doctor

// POST /hospital/doctors
const addDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create({
      ...req.body,
      hospital: req.hospital._id
    });

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const addDoctors = async (req, res) => {
  try {
    const { doctors } = req.body;

    const doctorsToInsert = doctors.map(doc => ({
      ...doc,
      hospital: req.hospital._id
    }));

    const savedDoctors = await Doctor.insertMany(doctorsToInsert);

    res.json(savedDoctors);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      hospital: req.hospital._id,
      isActive: true
    });

    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addDoctor, addDoctors, getDoctors };