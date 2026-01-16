import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Jarvis, a professional AI assistant. Be concise, smart, and helpful."
        },
        { role: "user", content: message }
      ]
    });

    return res.status(200).json({
      reply: response.choices[0].message.content
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI server error" });
  }
}
