import express from "express";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const router = express.Router();

// very small rule-based fallback
function ruleBasedMap(text) {
  const t = text.toLowerCase();
  if (t.match(/tooth|dental|teeth/)) return { specialty: "Dental", severity: "LOW" };
  if (t.match(/ear|hearing|earache/)) return { specialty: "ENT", severity: "LOW" };
  if (t.match(/rash|skin|acne|derma/)) return { specialty: "Dermatology", severity: "LOW" };
  if (t.match(/fracture|pain in bone|break/)) return { specialty: "Orthopedics", severity: "MED" };
  if (t.match(/fever|high temperature|breath|breathing/)) return { specialty: "General Physician", severity: "MED" };
  return { specialty: "General Physician", severity: "LOW" };
}

// POST /api/analyze-symptoms
router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  // if OpenAI key present, call AI
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Given these symptoms: ${text}\nReturn JSON {specialty: "...", severity: "LOW|MED|HIGH", notes: "..."} `;
      const resp = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4o-mini", // user can change as configured
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200
      }, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" }
      });
      const content = resp.data.choices?.[0]?.message?.content;
      try {
        const parsed = JSON.parse(content);
        return res.json(parsed);
      } catch(e) {
        // fallback to text parse
        return res.json({ specialty: "General Physician", severity: "LOW", notes: content });
      }
    } catch (err) {
      console.error("AI analyze error", err.message);
      const r = ruleBasedMap(text);
      return res.json({ ...r, notes: "Fallback rule-based mapping" });
    }
  } else {
    // no AI key — rule based
    const r = ruleBasedMap(text);
    return res.json({ ...r, notes: "Rule-based mapping" });
  }
});

export default router;