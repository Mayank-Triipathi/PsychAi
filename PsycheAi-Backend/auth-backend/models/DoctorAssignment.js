const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },

    stressPrediction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StressPrediction",
    },

    score: Number,

status: {
  type: String,
  enum: ["suggested", "accepted"],
  default: "suggested"
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorAssignment", assignmentSchema);