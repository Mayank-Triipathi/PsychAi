const mongoose = require("mongoose");

const stressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    traumaStress: Number,
    relationshipStress: Number,
    financialStress: Number,
    emotionalStress: Number,

    topIndicators: [String],

    medicationNeed: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
    },

    primaryProblem: String, // store result of your logic
  },
  { timestamps: true }
);

module.exports = mongoose.model("StressPrediction", stressSchema);