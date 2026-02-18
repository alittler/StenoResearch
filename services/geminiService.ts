
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
export async function askResearchQuestion(question: string, context: string): Promise<{ text: string, urls: string[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Project Context: ${context}\n\nResearch Inquiry: ${question}`,
      config: {
        systemInstruction: "You are an expert researcher. Use Google Search to find current data. Be concise and factual.",
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
export async function weaveProjectOutline(notes: {content: string, timestamp: number}[], research: string[]): Promise<{ text: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const notesContext = notes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n');
  const researchContext = research.join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Synthesize a comprehensive project outline. Newer notes should resolve conflicts.
      
      ### PROJECT NOTES
      ${notesContext}
      
      ### RESEARCH DATA
      ${researchContext}`,
      config: {
        systemInstruction: "You are a master project architect. Create a structured, hierarchical project brief in Markdown format.",
      }
    });

    return { text: response.text || "Synthesis resulted in no content." };
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * VISUALIZATION: Generates a concept image using Gemini 2.5 Flash Image.
 */
export async function generateProjectImage(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("No image data returned from model.");

    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * ARCHITECTURE: Shatters a wall of text into atomic project notes.
 */
export async function shredWallOfText(text: string): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Shatter the following project data into atomic, structured notes:\n\n${text}`,
      config: {
        systemInstruction: "You are a Knowledge Architect. Parse raw text into structured JSON records.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              is_priority: { type: Type.BOOLEAN },
            },
            required: ["title", "content", "category"],
          }
        }
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    handleApiError(error);
  }
}
