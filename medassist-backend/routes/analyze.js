router.post("/analyze-symptoms", async (req, res) => {
  const { text, age = null } = req.body;

  // Validate input
  if (!text) {
    return res.status(400).json({ error: "text required" });
  }

  // STRICT JSON PROMPT
  const prompt = `
Respond ONLY with valid JSON. 
No markdown, no backticks, no explanations. 
Do not include any extra text.

Analyze the following symptoms:
"${text}"

Age: ${age}

Return JSON in EXACTLY this structure:

{
  "specialty": "string",
  "severity": "LOW" | "MED" | "HIGH" | "CRITICAL",
  "follow_up_days": number,
  "medication_advice": "string",
  "health_tips": "string"
}
`;

  try {
    // Call AI
    const aiResponse = await callAI(prompt, 500);

    // aiResponse should already be JSON because callAI parses JSON
    return res.json({
      specialty: aiResponse.specialty,
      severity: aiResponse.severity,
      follow_up_days: aiResponse.follow_up_days,
      medication_advice: aiResponse.medication_advice,
      health_tips: aiResponse.health_tips
    });

  } catch (err) {
    console.error("Analyze symptoms error:", err);

    // Fallback in case AI breaks
    return res.status(500).json({
      error: "AI_JSON_ERROR",
      message: "AI returned invalid JSON. Check AI output or prompt."
    });
  }
});