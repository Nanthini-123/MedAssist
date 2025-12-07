router.post("/analyze-symptoms", async (req, res) => {
  const { text, age = null } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const prompt = `
Return ONLY valid JSON. No explanation, no markdown.
Just pure JSON.

Analyze symptoms: "${text}"
Age: ${age}

JSON format:
{
  "specialty": "string",
  "severity": "LOW|MED|HIGH|CRITICAL",
  "follow_up_days": number,
  "medication_advice": "string",
  "health_tips": "string"
}
`;

  try {
    const ai = await callAI(prompt, 600);

    return res.json({
      specialty: ai.specialty || "General Physician",
      severity: ai.severity || "MED",
      follow_up_days: ai.follow_up_days || 7,
      medication_advice: ai.medication_advice || "",
      health_tips: ai.health_tips || ""
    });
  } catch (err) {
    return res.status(500).json({ error: "AI_JSON_ERROR" });
  }
});