const Doctor = require("../models/Doctor");

/* ═══════════════════════════════════════════════════════
   1. Get Primary Problem (SUPER SIMPLE)
   ═══════════════════════════════════════════════════════ */

function getPrimaryProblem(prediction) {
  const { trauma, relationship, financial, emotional } = prediction;

  const map = {
    TRAUMA: trauma,
    RELATIONSHIP: relationship,
    FINANCIAL: financial,
    EMOTIONAL: emotional
  };

  return Object.entries(map).sort((a, b) => b[1] - a[1])[0][0];
}

/* ═══════════════════════════════════════════════════════
   2. Score Doctor (SIMPLE & STRONG)
   ═══════════════════════════════════════════════════════ */

function calculateScore(doc, prediction, primary) {
  let score = 0;

  const { trauma, relationship, financial, emotional } = prediction;
  const spec = doc.specialization || [];

  // 🎯 MAIN MATCH (BIG WEIGHT)
  if (primary === "TRAUMA" && spec.includes("Trauma")) {
    score += trauma;
  }

  if (primary === "RELATIONSHIP" && spec.includes("Relationships")) {
    score += relationship;
  }

  if (primary === "FINANCIAL" && spec.includes("Financial")) {
    score += financial;
  }

  if (primary === "EMOTIONAL") {
    if (
      ["Clinical Psychologist", "Counseling Psychologist"].includes(doc.providerType)
    ) {
      score += emotional;
    }
  }

  // 🧠 SECONDARY BOOST (small weight)
  if (spec.includes("Trauma")) score += trauma * 0.2;
  if (spec.includes("Relationships")) score += relationship * 0.2;
  if (spec.includes("Financial")) score += financial * 0.2;

  // 💊 MEDICATION LOGIC
  if (prediction.medicationNeed === "HIGH" && doc.providerType === "Psychiatrist") {
    score += 20;
  }

  if (
    prediction.medicationNeed === "MEDIUM" &&
    ["Psychiatrist", "Clinical Psychologist"].includes(doc.providerType)
  ) {
    score += 10;
  }

  if (
    prediction.medicationNeed === "LOW" &&
    ["Counseling Psychologist", "LMFT"].includes(doc.providerType)
  ) {
    score += 5;
  }

  return Math.round(score);
}

/* ═══════════════════════════════════════════════════════
   3. MAIN MATCH FUNCTION (CLEAN)
   ═══════════════════════════════════════════════════════ */

async function matchDoctors(prediction, hospitalId, selectedDay) {
  const primary = getPrimaryProblem(prediction);

  let doctors = await Doctor.find({
    hospital: hospitalId,
    isActive: true
  });

  // 📅 Availability filter (safe)
  if (selectedDay) {
    const available = doctors.filter(doc =>
      doc.availability?.some(a => a.day === selectedDay)
    );
    if (available.length) doctors = available;
  }

  // 🧮 Score all doctors
  const results = doctors.map(doc => ({
    doctor: doc,
    score: calculateScore(doc, prediction, primary)
  }));

  // 🔽 Sort
  results.sort((a, b) => b.score - a.score);

  // ✅ ALWAYS return best match (NO FAILURE)
  return {
    primaryProblem: primary,
    bestMatch: results[0],
    allMatches: results
  };
}

module.exports = { matchDoctors };