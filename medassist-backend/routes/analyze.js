// routes/analyze.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// -----------------------------
// Helper: Call OpenRouter AI (Claude)
// -----------------------------
async function callAI(prompt, max_tokens = 600) {
  if (!process.env.OPENROUTER_API_KEY)
    throw new Error("OpenRouter API key not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-opus-4.5",
      messages: [{ role: "user", content: prompt }],
      max_tokens
    })
  });

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || data?.completion || "";
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    // Fallback: return a clean default structure with raw for debugging
    return {
      raw,
      error: "AI returned malformed JSON",
      specialty: "General Physician",
      severity: "MED",
      red_flag: false,
      possible_conditions: [],
      follow_up_days: 7,
      medication_advice: "Rest, hydration, OTC medications as needed.",
      health_tips: "Maintain healthy diet, exercise regularly, and stay hydrated.",
      insurance_clinics: [],
      notes: ""
    };
  }
}

// -----------------------------
// POST /api/ai/analyze-symptoms
// Comprehensive symptom analysis without DB
// -----------------------------
router.post("/analyze-symptoms", async (req, res) => {
  const { text, age = null } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const prompt = `
Analyze the following symptoms: ${text}.
User age: ${age || "unknown"}.
Return ONLY JSON with the following structure:
{
  "specialty": "...",
  "severity": "LOW|MED|HIGH|CRITICAL",
  "red_flag": true|false,
  "possible_conditions": ["..."],
  "follow_up_days": number,
  "medication_advice": "...",
  "health_tips": "...",
  "insurance_clinics": ["..."],
  "notes": "..."
}
Include:
- Red flags (chest pain, shortness of breath, vision loss, severe headache)
- Multi-symptom differential diagnosis
- OTC advice & wellness tips
- Follow-up recommendations
- Suggested doctor specialty
`;

  try {
    const result = await callAI(prompt, 600);
    return res.json(result);
  } catch (err) {
    console.error("AI analyze error:", err.message);
    return res.status(500).json({
      error: "AI analyze error",
      message: err.message
    });
  }
});

// -----------------------------
// POST /api/ai/ask-ai
// General AI Q&A without DB
// -----------------------------
router.post("/ask-ai", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ answer: "Message is required" });

  try {
    const prompt = `Answer this medical question: ${message}`;
    const result = await callAI(prompt, 500);
    const answer = result.raw || result.notes || "AI service error";
    return res.json({ answer });
  } catch (err) {
    console.error("AI chat error:", err.message);
    return res.status(500).json({ answer: "AI service error, fallback triggered." });
  }
});

export default router;