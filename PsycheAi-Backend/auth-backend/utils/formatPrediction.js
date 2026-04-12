

function formatPrediction(aiResponse) {
  const domains = aiResponse.external_domains;

  const trauma = domains.Trauma || 0;
  const relationship = domains.Relationship || 0;
  const financial = domains.Financial || 0;
  const emotional = domains.Emotional || 0;

  // 🔹 medication logic (UPDATED)
  let medicationNeed = "LOW";

  if (aiResponse.overall_stress >= 75) {
    medicationNeed = "HIGH";
  } else if (aiResponse.overall_stress >= 40) {
    medicationNeed = "MEDIUM";
  }

  return {
    traumaStress: trauma,
    relationshipStress: relationship,
    financialStress: financial,
    emotionalStress: emotional, // NEW
    topIndicators: aiResponse.top_indicators,
    medicationNeed
  };
}

module.exports = { formatPrediction };