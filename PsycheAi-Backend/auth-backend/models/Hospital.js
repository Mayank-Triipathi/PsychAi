const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
{
  name: String,
  address: String,
  email: { type: String, unique: true },
  password: { type: String, select: false },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },

  verified: { type: Boolean, default: false },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HospitalAdmin",
  },

  bookingType: {
    type: String,
    enum: ["AUTO", "APPROVAL"],
    default: "AUTO",
  },

  clinicType: {
    type: String,
    enum: ["SOLO", "SMALL", "HOSPITAL"],
    default: "SMALL",
  },
},
{ timestamps: true }
);

hospitalSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Hospital", hospitalSchema);