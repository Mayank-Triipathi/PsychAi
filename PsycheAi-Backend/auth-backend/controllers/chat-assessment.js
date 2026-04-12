/* ═══════════════════════════════════════════════════════
   chat-assessment.js
   POST /api/chat-assessment
   Body:    { answers: [string] }  — all 8 answers
   Returns: { reply, done, prediction }
   ═══════════════════════════════════════════════════════ */

const AI_URL = process.env.AI_MODEL_URL || "http://localhost:8000/analyze-stress";

// Set USE_FAKE_AI=true in .env until your teammate's model is ready
const USE_FAKE_AI = process.env.USE_FAKE_AI === 'true';

const chatAssessment = async (req, res) => {
  try {
    const { answers = [] } = req.body;

    if (answers.length < 8) {
      return res.status(400).json({ message: "8 answers required" });
    }

    let result;

    if (USE_FAKE_AI) {
      // ── FAKE RESPONSE until model is ready ──────────────
      result = fakePrediction(answers);
    } else {
      // ── REAL trained model ───────────────────────────────
      const aiRes = await fetch(AI_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ answers }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return res.status(502).json({ message: "AI service error", error: err });
      }

      result = await aiRes.json();
    }

    // result shape: { overall_stress, external_domains, interpretation, top_indicators }
    const domains = result.external_domains || {};

    const prediction = {
      emotional:      toPercent(domains.emotional),
      financial:      toPercent(domains.financial),
      relationship:   toPercent(domains.relationship),
      trauma:         toPercent(domains.trauma),
      topIndicators:  result.top_indicators  || [],
      interpretation: result.interpretation  || "",
      primaryProblem: getPrimary(domains),
    };

    return res.json({
      reply:      result.interpretation || "Thank you for completing the assessment 🌿",
      done:       true,
      prediction,
    });

  } catch (err) {
    console.error("Chat assessment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── helpers ─────────────────────────────────────────────

function toPercent(val) {
  if (!val && val !== 0) return 0;
  // if model returns 0-1 range, multiply; if already 0-100, keep
  return Math.round(val <= 1 ? val * 100 : val);
}

function getPrimary(domains) {
  const entries = Object.entries(domains);
  if (!entries.length) return "General";
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top[0].charAt(0).toUpperCase() + top[0].slice(1);
}

function fakePrediction(answers) {
  // Simple keyword-based fake scoring so the UI works end-to-end
  const text = answers.join(' ').toLowerCase();

  const emotional    = score(text, ['anxious','overwhelmed','sad','depressed','stressed','tired','empty','hopeless']);
  const financial    = score(text, ['money','debt','bills','expenses','afford','financial','broke','cost']);
  const relationship = score(text, ['lonely','partner','family','friends','isolated','relationship','support']);
  const trauma       = score(text, ['past','memories','trauma','abuse','accident','loss','grief','nightmare']);

  const domains = { emotional, financial, relationship, trauma };

  return {
    overall_stress:   Math.round((emotional + financial + relationship + trauma) / 4) / 100,
    external_domains: domains,
    interpretation:   "Thank you for sharing. Based on your responses, I've prepared your wellness report 🌿",
    top_indicators:   topWords(text),
  };
}

function score(text, keywords) {
  const hits = keywords.filter(k => text.includes(k)).length;
  // base 20 + up to 60 from keywords, + some randomness
  return Math.min(100, 20 + hits * 12 + Math.floor(Math.random() * 15));
}

function topWords(text) {
  const all = ['past','partner','money','tired','mental','lonely','anxious','debt','family','memories'];
  return all.filter(w => text.includes(w)).slice(0, 3);
}

module.exports = { chatAssessment };