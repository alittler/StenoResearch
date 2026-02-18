
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Helper to extract meaningful error messages from Gemini API errors
 */
function handleApiError(error: any): never {
  console.error("Gemini API Error:", error);
  let message = error.message || "";
  let status = error.status;

  try {
    if (message.startsWith('{')) {
      const parsed = JSON.parse(message);
      message = parsed.error?.message || message;
      status = parsed.error?.code || status;
    }
  } catch (e) { /* ignore */ }

  if (status === 429 || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  throw new Error(message || "An unexpected network error occurred.");
}

/**
 * RESEARCH: Uses Gemini 3 Flash for speed and search grounding.
 */
export async function askResearchQuestion(question: string, context: string, apiKeyOverride?: string): Promise<{ text: string, urls: string[] }> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${context}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: "You are an expert researcher. Use Google Search to find current data. Be concise.",
        tools: [{ googleSearch: {} }],
      },
    });

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return {
      text: response.text || "No data found.",
      urls: Array.from(new Set(urls)),
    };
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * SYNTHESIS: Uses Gemini 3 Pro for complex reasoning.
 */
export async function weaveProjectOutline(notes: {content: string, timestamp: number}[], research: string[], apiKeyOverride?: string): Promise<{ text: string }> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  
  const ai = new GoogleGenAI({ apiKey });
  const text = notes.map(n => n.content).join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Synthesize this: ${text}\n\nResearch: ${research.join('\n')}`,
      config: {
        systemInstruction: "Create a professional project brief using Markdown.",
      }
    });
    return { text: response.text || "Synthesis failed." };
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * SHREDDING: Uses Gemini 3 Flash for fast JSON structuring.
 */
export async function shredWallOfText(text: string, apiKeyOverride?: string): Promise<any[]> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Structure this into JSON notes: ${text}`,
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

/**
 * IMAGE GENERATION: Uses Gemini 3 Pro Image for high quality.
 */
export async function generateProjectImage(prompt: string, apiKeyOverride?: string): Promise<string> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated.");
  } catch (error: any) {
    handleApiError(error);
  }
}
