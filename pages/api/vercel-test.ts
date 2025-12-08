// pages/api/vercel-test.ts

import { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Just say hi!" }
      ]
    });

    res.status(200).json({ success: true, message: response.choices[0].message.content });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ success: false, error: error.message || "Unknown error" });
  }
}