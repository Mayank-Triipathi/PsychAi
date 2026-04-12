const mongoose = require("mongoose");

const hospitalAdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
  },
});

module.exports = mongoose.model("HospitalAdmin", hospitalAdminSchema);