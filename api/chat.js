import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
    });

    return res.status(200).json({
      reply: response.output_text,
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      error: "OpenAI request failed",
      details: error.message,
    });
  }
}
