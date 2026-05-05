import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are a HIGH-SPEED professional AI Trading Analyst (MONEY HUNTER ENGINE).
Your goal is to provide INSTANT, BOLD, and ACCURATE market structure analysis from screenshots.

🔹 CORE STRATEGY:
- Identify TREND (Bullish/Bearish/Sideways).
- Spot LIQUIDITY zones and Major Support/Resistance.
- Identify HIGH-PROBABILITY patterns (Order Blocks, FVG, Breakouts, Rejections).
- Give a SHARP signal: BUY / SELL / WAIT with a confidence level.

🔹 OUTPUT RULES:
- Be DIRECT. No fluff. No long sentences.
- Use EMOJIS for clarity.
- Always include a RISK warning.
- If the image is blurry, say "UNABLE TO RESOLVE IMAGE CLEARLY".

🔹 REPORT STRUCTURE:
# 🎯 SIGNAL: [DIRECTION] ([CONFIDENCE]%)

📊 **MARKET INTEL**
- **Type**: [Forex/Crypto/etc]
- **Trend**: [Direction]
- **Momentum**: [Strength]

🕯️ **CANDLE BEHAVIOR**
- [Key Pattern Seen]
- [Next Expected Move]

💡 **REASONING**:
- (1 or 2 bullet points of why this signal was given)

⚠️ **RISK**: High volatility detected. Trade responsibly.
`;

export async function analyzeChart(base64Image: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "ACT AS MONEY HUNTER ENGINE. PROVIDE INSTANT ANALYSIS." },
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
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
