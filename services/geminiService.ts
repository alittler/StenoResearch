
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Helper to extract meaningful error messages from Gemini API errors
 * Explicitly marked as returning 'never' to help TypeScript with control flow analysis.
 */
function handleApiError(error: any): never {
  console.error("Gemini API Error Object:", error);
  
  // The error might be a stringified JSON in some environments
  let message = error.message || "";
  let status = error.status;

  try {
    if (message.startsWith('{')) {
      const parsed = JSON.parse(message);
      message = parsed.error?.message || message;
      status = parsed.error?.code || status;
    }
  } catch (e) { /* ignore parse error */ }

  if (status === 429 || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  if (status === 401 || status === 403 || message.includes("API_KEY_INVALID") || message.includes("unauthorized")) {
    throw new Error("INVALID_API_KEY");
  }
  
  throw new Error(message || "An unexpected network error occurred.");
}

/**
 * Executes a research question using Google Search grounding.
 */
export async function askResearchQuestion(question: string, context: string, apiKeyOverride?: string): Promise<{ text: string, urls: string[] }> {
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

    // response.text is a property access, per @google/genai guidelines.
    return {
      text: response.text || "No specific data found.",
      urls: Array.from(new Set(urls)),
    };
  } catch (error: any) {
    // Calling handleApiError without 'return' since it always throws.
    handleApiError(error);
  }
}

/**
 * Synthesizes notes and research into a professional project outline.
 */
export async function weaveProjectOutline(notes: {content: string, timestamp: number}[], research: string[], apiKeyOverride?: string): Promise<{ text: string }> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  
  const ai = new GoogleGenAI({ apiKey });
  const ledgerText = notes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n---\n');
  const researchText = research.join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `LEDGER ENTRIES:\n${ledgerText}\n\nRESEARCH CONTEXT:\n${researchText}\n\nTASK: Generate a professional project outline.`,
      config: {
        systemInstruction: "You are a senior project architect. Synthesize logs and research into a brief. Use Markdown.",
      }
    });
    return { text: response.text || "Synthesis failed." };
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * Generates conceptual project imagery.
 */
export async function generateProjectImage(prompt: string, apiKeyOverride?: string): Promise<string> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    // Iterate through candidates and parts to find the inline image data.
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned.");
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * Structures raw text into atomic project notes using JSON response mode.
 */
export async function shredWallOfText(text: string, apiKeyOverride?: string): Promise<any[]> {
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
    handleApiError(error);
  }
}
