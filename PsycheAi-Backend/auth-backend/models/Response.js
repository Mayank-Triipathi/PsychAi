const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },

    answer: String,
    score: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Response", responseSchema);