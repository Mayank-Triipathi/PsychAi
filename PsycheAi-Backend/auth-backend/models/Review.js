const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },

    rating: Number,
    comment: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);