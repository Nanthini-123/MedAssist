import express from "express";
import routerAI from "./ai.js";  // import the AI router (default export)
import fetch from "node-fetch";   // required for callAI
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// -----------------------------
// Utility function to call AI (from ai.js logic)
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
  const raw = data?.choices?.[0]?.message?.content || data?.completion || "{}";

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid AI JSON: ${raw}`);
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
      error: "AI_JSON_ERROR",
      message: "AI returned invalid JSON"
    });
  }
});

export default router;