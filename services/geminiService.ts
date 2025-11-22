import { GoogleGenAI } from "@google/genai";
import { BristolType } from '../types';

const getAIClient = () => {
  if (!process.env.API_KEY) {
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generatePoopInsight = async (type: BristolType, notes: string): Promise<string> => {
  const client = getAIClient();
  if (!client) return "AI is resting (No API Key).";

  try {
    const prompt = `
      You are a humorous but helpful health companion app called "DooDoo Log".
      The user just logged a bowel movement.
      
      Data:
      - Bristol Stool Scale Type: ${type}
      - User Notes: "${notes}"

      Task:
      Provide a very short (max 2 sentences) witty comment about this entry.
      If the type indicates constipation (1-2) or diarrhea (6-7), gently suggest water or fiber in a fun way.
      If it's ideal (3-4), congratulate them.
      
      Tone: Fun, warm, supportive, brown-themed puns allowed but don't be gross.
      Important: Do NOT give serious medical advice.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Good job tracking!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Great job logging! (AI temporarily offline)";
  }
};
