const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  slot: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected"],
    default: "pending"
  }

}, { timestamps: true });

appointmentSchema.index({ doctor: 1, date: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);