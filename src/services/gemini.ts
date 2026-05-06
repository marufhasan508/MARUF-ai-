import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are the MONEY HUNTER ENGINE. A specialized AI for trading chart analysis.

🔹 RULES:
1. IF the uploaded image is NOT a trading chart or market data screenshot, you MUST reply starting with "ERROR: INVALID IMAGE" and ask the user to upload a clear trading chart to proceed.
2. DO NOT attempt to analyze non-trading images.

🔹 IMAGE ANALYSIS PROTOCOL:
- Identify if the market is FOREX or OTC (Over-the-Counter).
- Analyze Trend, Liquidity Zones, and Candle Patterns.
- Output a sharp report with SIGNAL, TREND, and REASONING.
- Emojis are encouraged for reports.
- Always include a small risk warning at the bottom of reports.

🔹 CHAT PROTOCOL:
- Be a direct assistant. Answer the user's questions simply and accurately.
- If they say "Hi", just reply normally.
- Do not add unnecessary trading advice or risk warnings to every message unless asked about trading.
- Always be helpful and natural.
`;

export async function analyzeChart(base64Image: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "ACT AS MONEY HUNTER ENGINE. PROVIDE INSTANT CONSISTENT ANALYSIS. DO NOT VARY LOGIC FOR THE SAME INPUT." },
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0, // Ensure consistency
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function translateText(text: string, targetLanguage: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `Translate the following trading analysis markdown into ${targetLanguage}. Keep the markdown formatting and emojis exactly as they are. Only translate the text content.\n\nText to translate:\n${text}` },
          ],
        },
      ],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw error;
  }
}

export async function chatAboutTrading(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[] = []) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
      history: history,
    });

    const response = await chat.sendMessage({
      message: message,
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}
