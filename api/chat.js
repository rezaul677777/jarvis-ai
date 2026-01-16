import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing on server" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "You are Jarvis, a helpful assistant. Keep replies concise." },
        { role: "user", content: message }
      ]
    });

    return res.status(200).json({ reply: response.output_text });
  } catch (err) {
    console.error("API crash:", err);
    return res.status(500).json({ error: "Server error", details: err?.message || String(err) });
  }
}
