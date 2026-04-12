const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: String,
  category: {
    type: String,
   enum: ["Trauma", "Relationships", "Financial", "Emotional"],
  },
});

module.exports = mongoose.model("Question", questionSchema);