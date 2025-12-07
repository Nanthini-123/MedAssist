// routes/analyze.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// -----------------------------
// callAI utility
// -----------------------------
async function callAI(prompt, max_tokens = 300) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not set");
  }

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
  console.log("Raw AI response:", JSON.stringify(data, null, 2));

  // Try multiple possible paths
  const raw = data?.choices?.[0]?.message?.content || data?.completion || "";

  if (!raw) throw new Error("Empty AI response");

  // Try parse JSON, fallback to default template if fails
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("AI returned invalid JSON, using fallback template.");
    return {
      specialty: "General Physician",
      severity: "MED",
      follow_up_days: 3,
      medication_advice: "",
      health_tips: "",
      notes: raw
    };
  }
}

// -----------------------------
// POST /analyze-symptoms
// -----------------------------
router.post("/analyze-symptoms", async (req, res) => {
  const { text, age = null } = req.body;

  if (!text) {
    return res.status(400).json({ error: "text required" });
  }

  const prompt = `
Respond ONLY with valid JSON.
No markdown, no backticks, no explanations.

Analyze symptoms:
"${text}"

Age: ${age}

Return JSON:
{
  "specialty": "string",
  "severity": "LOW" | "MED" | "HIGH" | "CRITICAL",
  "follow_up_days": number,
  "medication_advice": "string",
  "health_tips": "string"
}
`;

  try {
    const aiResponse = await callAI(prompt, 500);
    return res.json(aiResponse);

  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({
      specialty: "General Physician",
      severity: "MED",
      follow_up_days: 3,
      medication_advice: "",
      health_tips: "",
      notes: "AI service error, using fallback template"
    });
  }
});

export default router;