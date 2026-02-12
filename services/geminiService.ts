
import { GoogleGenAI } from "@google/genai";

/**
 * Robustly retrieves the API key.
 * Prioritizes manually entered keys from localStorage (for user convenience on Vercel/External),
 * then falls back to the environment variable.
 */
const getApiKey = () => {
  const manualKey = localStorage.getItem('steno_manual_key');
  if (manualKey) return manualKey;

  // Safe access for various environments (Node, Vite, Webpack, etc.)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

  return undefined;
};

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export async function askResearchQuestion(question: string, context: string = "") {
  try {
    const ai = getClient();
    const prompt = `
      I am working on a project. 
      Current context: "${context}"
      Research Question: "${question}"
      
      Provide a concise, factual, and helpful answer. 
      Use the search tool to verify facts.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No response generated.";
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter((uri: string | undefined): uri is string => !!uri) || [];

    return { text, urls };
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING" || error.message?.includes("401") || error.message?.includes("403")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    throw error;
  }
}

export async function generateProjectImage(prompt: string) {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A professional concept visual: ${prompt}. Cinematic, detailed.` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        tools: [{ googleSearch: {} }] 
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image returned");
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING" || error.message?.includes("401") || error.message?.includes("403")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    throw error;
  }
}

export async function weaveProjectOutline(notepadNotes: {content: string, timestamp: number}[], researchNotes: string[]) {
  try {
    const ai = getClient();
    const sortedNotes = [...notepadNotes].sort((a, b) => b.timestamp - a.timestamp);
    
    const prompt = `
      Create a structured project outline.
      Notes: ${sortedNotes.map(n => n.content).join('\n---\n')}
      Research: ${researchNotes.join('\n---\n')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    return { text: response.text || "Synthesis failed." };
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING" || error.message?.includes("401") || error.message?.includes("403")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    throw error;
  }
}
