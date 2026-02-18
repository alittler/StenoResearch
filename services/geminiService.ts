
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Performs research using Google Search grounding.
 */
export async function askResearchQuestion(question: string, context: string, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current Project Context:\n${context}\n\nResearch Inquiry: ${question}`,
      config: {
        systemInstruction: "You are an expert project analyst and researcher. Provide highly factual, concise information. Do not use greetings or conversational filler. Use Markdown for structuring data.",
        tools: [{ googleSearch: {} }],
      },
    });

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return {
      text: response.text || "No specific data found.",
      urls: Array.from(new Set(urls)),
    };
  } catch (error: any) {
    if (error.message?.toLowerCase().includes("key") || error.status === 401 || error.status === 403) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
}

/**
 * Synthesizes project notes and research into a structured outline.
 */
export async function weaveProjectOutline(notes: {content: string, timestamp: number}[], research: string[], apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  
  const ai = new GoogleGenAI({ apiKey });
  const ledgerText = notes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n---\n');
  const researchText = research.join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `LEDGER ENTRIES:\n${ledgerText}\n\nRESEARCH CONTEXT:\n${researchText}\n\nTASK: Generate a professional, logically structured project outline.`,
      config: {
        systemInstruction: "You are a senior project architect. Synthesize logs and research into a clean brief. Use Markdown.",
      }
    });
    return { text: response.text || "Synthesis failed." };
  } catch (error: any) {
    if (error.message?.toLowerCase().includes("key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
}

/**
 * Generates an image representing a project concept.
 */
export async function generateProjectImage(prompt: string, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned.");
  } catch (error: any) {
    if (error.message?.toLowerCase().includes("key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
}

/**
 * Shreds unstructured text into structured project records.
 */
export async function shredWallOfText(text: string, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Structure this raw text into atomic project notes: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ['title', 'content', 'category']
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    if (error.message?.toLowerCase().includes("key")) throw new Error("INVALID_API_KEY");
    throw error;
  }
}
