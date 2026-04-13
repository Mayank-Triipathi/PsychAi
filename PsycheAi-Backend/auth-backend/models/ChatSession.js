const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    prediction: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "StressPrediction"
},

    messages: [
      {
        sender: { type: String, enum: ["user", "ai"] },
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSchema);