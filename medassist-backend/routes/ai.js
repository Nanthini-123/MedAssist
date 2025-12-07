import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// -----------------------------
// Rule-based fallback mapping
// -----------------------------
function ruleMapSymptoms(text) {
  const t = text.toLowerCase();
  if (t.match(/tooth|dental|cavity|wisdom|teeth/)) return { specialty: "Dental", severity: "LOW" };
  if (t.match(/ear|hearing|earache|tinnitus/)) return { specialty: "ENT", severity: "LOW" };
  if (t.match(/skin|rash|acne|itch|derma/)) return { specialty: "Dermatology", severity: "LOW" };
  if (t.match(/pain|fracture|sprain|bone/)) return { specialty: "Orthopedics", severity: "MED" };
  if (t.match(/fever|cough|cold|breath|chest/)) return { specialty: "General Physician", severity: "MED" };
  return { specialty: "General Physician", severity: "LOW" };
}

// -----------------------------
// POST /api/analyze-symptoms
// -----------------------------
router.post("/analyze-symptoms", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-opus-4.5",
          messages: [
            { role: "user", content: `Analyze these symptoms: ${text}. Return JSON with {specialty: "...", severity: "LOW|MED|HIGH", notes: "..."}.` }
          ],
          max_tokens: 300
        })
      });

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || data?.completion || "";

      try {
        const parsed = JSON.parse(raw);
        return res.json(parsed);
      } catch (e) {
        return res.json({ ...ruleMapSymptoms(text), notes: raw });
      }
    }

    // fallback rule-based
    const mapped = ruleMapSymptoms(text);
    return res.json({ ...mapped, notes: "Fallback rule-based mapping" });

  } catch (err) {
    console.error("AI analyze error:", err.message);
    const mapped = ruleMapSymptoms(text);
    return res.json({ ...mapped, notes: "Error occurred, using rule-based mapping" });
  }
});

// -----------------------------
// POST /api/ask-ai
// -----------------------------
router.post("/ask-ai", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ answer: "Message is required" });

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || data?.completion || "AI service error";
      return res.json({ answer: content });
    }

    // fallback response
    return res.json({ answer: "No AI key configured. Please set OPENROUTER_API_KEY." });

  } catch (err) {
    console.error("AI chat error:", err.message);
    return res.json({ answer: "AI service error, fallback triggered." });
  }
});

export default router;