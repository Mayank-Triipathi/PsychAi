const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
{
  name: String,
  email: { type: String, unique: true },
  password: String,

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
  },

  specialization: [
    {
      type: String,
      enum: ["Trauma", "Relationships", "Financial"],
    },
  ],

  providerType: {
    type: String,
    enum: [
      "Clinical Psychologist",
      "Counseling Psychologist",
      "Psychiatrist",
      "LMFT",
      "Financial Counselor"
    ],
    required: true
  },

  experienceYears: Number,

  availability: [
    {
      day: {
        type: String,
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      },
      slots: [String]
    }
  ],

  isActive: { type: Boolean, default: true },

},
{ timestamps: true }
);

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);