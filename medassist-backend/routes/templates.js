import express from "express";
const router = express.Router();

const templates = [
  { id: "confirm", title:"Booking Confirmed", text:"Hello {{name}}, your appointment is confirmed for {{date}} at {{time}}. Booking ID: {{id}}" },
  { id: "reminder", title:"Reminder", text:"Reminder: your appointment is at {{date}} {{time}}. Reply STOP to opt out." },
  { id: "followup", title:"Follow-up", text:"Hi {{name}}, how are you feeling after your visit? Reply to this message." }
];

router.get("/", (req,res) => res.json({ templates }));
router.post("/send", async (req,res)=> {
  const { templateId, visitorEmail, visitorPhone, vars } = req.body;
  const tpl = templates.find(t=>t.id===templateId);
  if(!tpl) return res.status(404).json({error:"not found"});
  const text = tpl.text.replace(/\{\{(\w+)\}\}/g, (_,k)=> vars[k] || "");
  // call SMS/email helpers here (sendSmsPlain/sendBookingEmail)
  res.json({ success:true, sentText: text });
});

export default router;