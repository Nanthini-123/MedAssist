// routes/analyze.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ---- 1. AI CALL FUNCTION VIA OPENROUTER ----
async function callAI(userText, age) {
  try {
    const prompt = `
You are a medical triage AI. Analyze symptoms and give structured JSON only.

Symptoms: ${userText}
Age: ${age}

Return JSON with:
- specialty
- severity (LOW / MED / HIGH)
- follow_up_days
- medication_advice
- health_tips
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-opus-4.5",
        messages: [
          { role: "system", content: "Return ONLY JSON. No extra text." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error("Empty AI response");
    }

    return JSON.parse(data.choices[0].message.content);

  } catch (err) {
    console.error("AI ERROR:", err);
    throw err;  // Let the main route handle it
  }
}

// ---- 2. MAIN ROUTE ----
router.post("/analyze-symptoms", async (req, res) => {
  const { text, age } = req.body;

  if (!text) return res.status(400).json({ error: "text required" });

  try {
    const aiResult = await callAI(text, age);
    return res.json(aiResult);
  } catch (err) {
    return res.status(500).json({
      error: "AI_JSON_ERROR",
      message: err.message || "AI returned invalid response"
    });
  }
});

// ---- 3. TEST ROUTE ----
router.get("/test-ai", async (req, res) => {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    const data = await r.json();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;