/* ═══════════════════════════════════════════════════════
   chat-assessment.js
   POST /api/chat-assessment
   ═══════════════════════════════════════════════════════ */

const ChatSession = require("../models/ChatSession");
const StressPrediction = require("../models/StressPrediction");

const AI_URL = process.env.AI_MODEL_URL || "http://localhost:8000/analyze-stress";
const USE_FAKE_AI = process.env.USE_FAKE_AI === 'true';

const chatAssessment = async (req, res) => {
  try {
    const { answers = [] } = req.body;

    if (answers.length < 8) {
      return res.status(400).json({ message: "8 answers required" });
    }

    let result;

    if (USE_FAKE_AI) {
      result = fakePrediction(answers);
    } else {
      console.log("Sending answers:", answers);
      const aiRes = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return res.status(502).json({ message: "AI service error", error: err });
      }

      result = await aiRes.json();
    }

    const domains = result.external_domains || {};

    const prediction = {
      emotional: toPercent(domains.Emotional),
      financial: toPercent(domains.Financial),
      relationship: toPercent(domains.Relationship),
      trauma: toPercent(domains.Trauma),
      topIndicators: result.top_indicators || [],
      interpretation: result.interpretation || "",
      primaryProblem: getPrimary(domains),
    };

    /* ═══════════════════════════════════════════════
       🔥 SAVE STRESS PREDICTION
       ═══════════════════════════════════════════════ */

    const savedPrediction = await StressPrediction.create({
      user: req.user?._id || null,

      traumaStress: prediction.trauma,
      relationshipStress: prediction.relationship,
      financialStress: prediction.financial,
      emotionalStress: prediction.emotional,

      topIndicators: prediction.topIndicators,

      medicationNeed:
        prediction.emotional > 70 ? "HIGH" :
          prediction.emotional > 40 ? "MEDIUM" : "LOW",

      primaryProblem: prediction.primaryProblem,
    });

    /* ═══════════════════════════════════════════════
       🔥 SAVE CHAT SESSION (UPDATED)
       ═══════════════════════════════════════════════ */

    await ChatSession.create({
      user: req.user?._id || null,

      prediction: savedPrediction._id,   // ✅ FIX ADDED HERE

      messages: [
        ...answers.map(ans => ({
          sender: "user",
          text: ans,
        })),
        {
          sender: "ai",
          text: result.interpretation || "Assessment completed",
        }
      ],
    });

    /* ═══════════════════════════════════════════════
       RESPONSE
       ═══════════════════════════════════════════════ */

    return res.json({
      reply: result.interpretation || "Thank you for completing the assessment 🌿",
      done: true,
      prediction,
      predictionId: savedPrediction._id,
    });

  } catch (err) {
    console.error("Chat assessment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function toPercent(val) {
  if (!val && val !== 0) return 0;
  return Math.round(val <= 1 ? val * 100 : val);
}

function getPrimary(domains) {
  const entries = Object.entries(domains);
  if (!entries.length) return "General";
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top[0].charAt(0).toUpperCase() + top[0].slice(1);
}

function fakePrediction(answers) {
  const text = answers.join(" ").toLowerCase();

  const emotional = score(text, ['anxious', 'overwhelmed', 'sad', 'depressed', 'stressed', 'tired', 'empty', 'hopeless']);
  const financial = score(text, ['money', 'debt', 'bills', 'expenses', 'afford', 'financial', 'broke', 'cost']);
  const relationship = score(text, ['lonely', 'partner', 'family', 'friends', 'isolated', 'relationship', 'support']);
  const trauma = score(text, ['past', 'memories', 'trauma', 'abuse', 'accident', 'loss', 'grief', 'nightmare']);

  const domains = { emotional, financial, relationship, trauma };

  return {
    overall_stress: Math.round((emotional + financial + relationship + trauma) / 4) / 100,
    external_domains: domains,
    interpretation: "Thank you for sharing. Based on your responses, I've prepared your wellness report 🌿",
    top_indicators: topWords(text),
  };
}

function score(text, keywords) {
  const hits = keywords.filter(k => text.includes(k)).length;
  return Math.min(100, 20 + hits * 12 + Math.floor(Math.random() * 15));
}

function topWords(text) {
  const all = ['past', 'partner', 'money', 'tired', 'mental', 'lonely', 'anxious', 'debt', 'family', 'memories'];
  return all.filter(w => text.includes(w)).slice(0, 3);
}

module.exports = { chatAssessment };