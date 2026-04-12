const Doctor = require("../models/Doctor");

// 🔹 1. Identify Primary Problem
function getPrimaryProblem(trauma, relationship, financial, emotional) {

  // Existing combinations
  if (
    Math.abs(trauma - relationship) <= 5 &&
    trauma > financial &&
    relationship > financial
  ) return "TRAUMA + RELATIONSHIP";

  if (
    Math.abs(trauma - financial) <= 5 &&
    trauma > relationship &&
    financial > relationship
  ) return "TRAUMA + FINANCIAL";

  if (
    Math.abs(relationship - financial) <= 5 &&
    relationship > trauma &&
    financial > trauma
  ) return "RELATIONSHIP + FINANCIAL";

  if (
    Math.abs(trauma - relationship) <= 5 &&
    Math.abs(trauma - financial) <= 5
  ) return "TRAUMA + RELATIONSHIP + FINANCIAL";

  // 🔥 NEW: Emotional combinations
  if (
    Math.abs(trauma - emotional) <= 5 &&
    trauma > relationship &&
    emotional > relationship
  ) return "TRAUMA + EMOTIONAL";

  if (
    Math.abs(relationship - emotional) <= 5 &&
    relationship > financial &&
    emotional > financial
  ) return "RELATIONSHIP + EMOTIONAL";

  if (
    Math.abs(financial - emotional) <= 5 &&
    financial > trauma &&
    emotional > trauma
  ) return "FINANCIAL + EMOTIONAL";

  // 🔥 NEW: Single Emotional
  if (
    emotional > trauma &&
    emotional > relationship &&
    emotional > financial
  ) return "EMOTIONAL";

  // Existing single domain
  if (trauma > relationship && trauma > financial) return "TRAUMA";
  if (relationship > trauma && relationship > financial) return "RELATIONSHIP";
  if (financial > trauma && financial > relationship) return "FINANCIAL";

  return "UNKNOWN";
}

// 🔹 2. Calculate Score
function calculateScore(doc, prediction, primaryProblem) {
  let score = 0;

  const {
    traumaStress,
    relationshipStress,
    financialStress,
    emotionalStress, // 🔥 NEW
    topIndicators,
  } = prediction;

  // Trauma
  if (doc.specialization.includes("Trauma")) {
    if (primaryProblem.includes("TRAUMA")) {
      score += traumaStress;
    } else if (primaryProblem.includes("TRAUMA +")) {
      score += traumaStress * 0.8;
    }
  }

  // Relationship
  if (doc.specialization.includes("Relationships")) {
    if (primaryProblem.includes("RELATIONSHIP")) {
      score += relationshipStress;
    } else if (primaryProblem.includes("RELATIONSHIP +")) {
      score += relationshipStress * 0.8;
    }
  }

  // Financial
  if (
    doc.specialization.includes("Financial") ||
    doc.providerType === "Financial Counselor"
  ) {
    if (primaryProblem.includes("FINANCIAL")) {
      score += financialStress;
    }
  }

  // 🔥 NEW: Emotional scoring
  if (
    primaryProblem.includes("EMOTIONAL") &&
    ["Clinical Psychologist", "Counseling Psychologist"].includes(doc.providerType)
  ) {
    score += emotionalStress;
  }

  // 🔹 Bonus
  if (topIndicators.includes("past") && doc.specialization.includes("Trauma")) {
    score += 10;
  }

  if (
    topIndicators.includes("partner") &&
    (doc.specialization.includes("Relationships") ||
      doc.providerType === "LMFT")
  ) {
    score += 10;
  }

  if (
    topIndicators.includes("money") &&
    (doc.specialization.includes("Financial") ||
      doc.providerType === "Financial Counselor")
  ) {
    score += 10;
  }

  // 🔥 NEW: Emotional indicators
  if (
    topIndicators.includes("mental") &&
    ["Clinical Psychologist", "Counseling Psychologist"].includes(doc.providerType)
  ) {
    score += 8;
  }

  if (
    topIndicators.includes("tired") &&
    doc.providerType === "Counseling Psychologist"
  ) {
    score += 5;
  }

  return score;
}

// 🔹 3. Main Matching Function
async function matchDoctors(prediction, hospitalId, selectedDay) {

  const primaryProblem = getPrimaryProblem(
    prediction.traumaStress,
    prediction.relationshipStress,
    prediction.financialStress,
    prediction.emotionalStress // 🔥 NEW
  );

  let doctors = await Doctor.find({
    hospital: hospitalId,
    isActive: true,
  });

  // 🔥 1. FILTER BY medicationNeed
  if (prediction.medicationNeed === "HIGH") {
    doctors = doctors.filter(doc => doc.providerType === "Psychiatrist");
  }

  else if (prediction.medicationNeed === "MEDIUM") {
    doctors = doctors.filter(doc =>
      ["Clinical Psychologist", "Counseling Psychologist", "Psychiatrist"].includes(doc.providerType)
    );
  }

  else if (prediction.medicationNeed === "LOW") {
    doctors = doctors.filter(doc =>
      ["Counseling Psychologist", "LMFT", "Financial Counselor"].includes(doc.providerType)
    );
  }

  // 🔥 EDGE CASE: no doctors after filtering
  if (doctors.length === 0) {
    doctors = await Doctor.find({ hospital: hospitalId, isActive: true });
  }

  // 🔥 2. FILTER BY AVAILABILITY (SAFE VERSION)
if (selectedDay) {
  const availableDoctors = doctors.filter(doc =>
    doc.availability?.some(a => a.day === selectedDay)
  );

  // ✅ If some doctors available → use them
  if (availableDoctors.length > 0) {
    doctors = availableDoctors;
  }
  // ❗ else → DO NOT fail, keep original doctors (fallback)
}


  // 🔥 3. SCORING
  const results = doctors.map(doc => {
    const score = calculateScore(doc, prediction, primaryProblem);
    return { doctor: doc, score };
  });

  // 🔥 4. SORT
  results.sort((a, b) => b.score - a.score);

  // 🔥 EDGE CASE: weak match
  if (results[0].score < 20) {
    return {
      primaryProblem,
      bestMatch: null,
      message: "No strong match found"
    };
  }

  return {
    primaryProblem,
    bestMatch: results[0],
    allMatches: results
  };
}

module.exports = { matchDoctors };