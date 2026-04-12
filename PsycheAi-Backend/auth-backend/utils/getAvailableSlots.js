const Appointment = require("../models/Appointment");

async function getAvailableSlots(doctor, selectedDate, selectedDay) {

  // 1. Get slots for that day
  const dayData = doctor.availability.find(d => d.day === selectedDay);

  if (!dayData) return [];

  const allSlots = dayData.slots;

  // 2. Get booked slots
  const booked = await Appointment.find({
    doctor: doctor._id,
    date: selectedDate,
    status: { $in: ["pending", "confirmed"] }
  });

  const bookedSlots = booked.map(b => b.slot);

  // 3. Remove booked slots
  const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

  return availableSlots;
}

module.exports = { getAvailableSlots };