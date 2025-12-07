// routes/analyze.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import pool from "../db.js"; // PostgreSQL / MySQL connection
dotenv.config();

const router = express.Router();

// -----------------------------
// Helper: Call OpenRouter AI (Claude)
// -----------------------------
async function callAI(prompt, max_tokens = 600) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OpenRouter API key not configured");

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
    return { raw, error: "AI returned malformed JSON" };
  }
}

// -----------------------------
// POST /api/ai/analyze-symptoms
// Comprehensive symptom analysis
// -----------------------------
router.post("/analyze-symptoms", async (req, res) => {
  const { text, age = null, insurance = null } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  // AI prompt for multi-feature analysis
  const prompt = `
Analyze the following symptoms: ${text}.
User age: ${age || "unknown"}.
Return ONLY JSON with the following structure:
{
  "specialty": "...",             // Suggested doctor
  "severity": "LOW|MED|HIGH|CRITICAL", // Urgency
  "red_flag": true|false,         // Critical symptoms present?
  "possible_conditions": ["..."], // Multi-symptom differential
  "follow_up_days": number,       // Suggested follow-up interval
  "medication_advice": "...",     // Non-prescription advice
  "health_tips": "...",           // Wellness tips
  "insurance_clinics": ["..."],   // List of clinics if insurance provided
  "notes": "..."                  // Additional info
}
Include:
- Red flags (chest pain, shortness of breath, vision loss, severe headache)
- Multi-symptom differential diagnosis
- OTC advice & wellness tips
- Follow-up recommendations
- Suggested doctor specialty
`;

  try {
    let result = await callAI(prompt, 600);

    // Insurance-based clinic suggestions
    if (insurance) {
      const clinicResult = await pool.query(
        `SELECT clinic_name FROM insurance_clinics WHERE insurance_name = $1`,
        [insurance]
      );
      result.insurance_clinics = clinicResult.rows.map(r => r.clinic_name);
    }

    // Fallback defaults if AI fails
    result.specialty = result.specialty || "General Physician";
    result.severity = result.severity || "MED";
    result.red_flag = result.red_flag !== undefined ? result.red_flag : false;
    result.possible_conditions = result.possible_conditions || [];
    result.follow_up_days = result.follow_up_days || 7;
    result.medication_advice = result.medication_advice || "Rest, hydration, OTC medications as needed.";
    result.health_tips = result.health_tips || "Maintain healthy diet, exercise regularly, and stay hydrated.";
    result.notes = result.notes || result.raw || "";

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
// General AI Q&A
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