import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function askOpenRouter(userMessage) {
  if (!userMessage) return "Message is required";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-opus-4.5",
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 500, // <= set a safe token limit
        temperature: 0.7
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("OpenRouter returned non-JSON response:", text);
      return "AI service error";
    }

    if (data.error) return `AI service error: ${data.error.message}`;
    if (!data.choices || !data.choices[0]) return "AI service error";

    return data.choices[0].message.content;

  } catch (err) {
    console.error("OpenRouter Exception:", err);
    return "AI service error";
  }
}