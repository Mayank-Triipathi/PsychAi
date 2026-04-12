const StressPrediction = require("../models/StressPrediction");
const { matchDoctors } = require("../services/matchingService");

const matchDoctor = async (req, res) => {
  try {
    const { predictionId, hospitalId, day } = req.body;

    // 1. Get prediction
    const prediction = await StressPrediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({ message: "Prediction not found" });
    }

    // 2. Run matching
    const result = await matchDoctors(prediction, hospitalId, day);

    if (!result.bestMatch) {
  return res.json({
    primaryProblem: result.primaryProblem,
    doctor: null,
    score: 0,
    message: result.message || "No strong match"
  });
}

    res.json({
      primaryProblem: result.primaryProblem,
      doctor: result.bestMatch.doctor,
      score: result.bestMatch.score
    });

  } catch (err) {
  console.error(err);   // 👈 ADD THIS
  res.status(500).json({ message: "Server error", error: err.message });
}};
module.exports = { matchDoctor };