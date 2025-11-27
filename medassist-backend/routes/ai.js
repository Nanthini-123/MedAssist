// routes/ai.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

// Simple rule-based fallback mapping
function ruleMapSymptoms(text) {
  const t = text.toLowerCase();
  if (t.match(/tooth|dental|cavity|wisdom/)) return { specialty: "Dental", severity: "LOW" };
  if (t.match(/ear|hearing|earache|tinnitus/)) return { specialty: "ENT", severity: "LOW" };
  if (t.match(/skin|rash|acne|itch/)) return { specialty: "Dermatology", severity: "LOW" };
  if (t.match(/pain|fracture|sprain|bone/)) return { specialty: "Orthopedics", severity: "MED" };
  if (t.match(/fever|cough|cold|breath|chest/)) return { specialty: "General Physician", severity: "MED" };
  return { specialty: "General Physician", severity: "LOW" };
}

router.post("/analyze-symptoms", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  // If OpenRouter available, call it, else fallback to rule-based
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-opus-4.5",
          messages: [{ role: "user", content: `Analyze symptoms: ${text}. Provide suggested specialty and severity (LOW/MED/HIGH) and short advice.` }],
          max_tokens: 300
        })
      });
      const data = await apiRes.json();
      // prefer data.choices[0].message.content or data.completion
      const content = data?.choices?.[0]?.message?.content || data?.completion || JSON.stringify(data);
      // Try to parse suggestions from content (best effort)
      return res.json({ analysis: content });
    } catch (err) {
      console.error("OpenRouter error", err);
    }
  }

  // fallback
  const mapped = ruleMapSymptoms(text);
  return res.json({
    analysis: {
      suggestedSpecialty: mapped.specialty,
      severity: mapped.severity,
      advice: "This is a best-effort suggestion. Please consult a doctor for confirmation."
    }
  });
});

// lightweight chat/ask-ai (return plain answer)
router.post("/ask-ai", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ answer: "Message is required" });

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-opus-4.5",
          messages: [{ role: "user", content: message }],
          max_tokens: 500
        })
      });
      const data = await apiRes.json();
      const content = data?.choices?.[0]?.message?.content || data?.completion || "AI service error";
      return res.json({ answer: content });
    } catch (err) {
      console.error("AI call error", err);
      return res.json({ answer: "AI service error" });
    }
  }

  // fallback: simple canned response
  return res.json({ answer: "AI not configured. Please enable OPENROUTER_API_KEY for richer responses." });
});

export default router;