
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Helper to resolve the best available API key.
 */
function getApiKey(overrideKey?: string): string {
  const key = (overrideKey && overrideKey.trim() !== '') ? overrideKey : process.env.API_KEY;
  if (!key || key === 'undefined' || key.length < 5) {
    throw new Error("API_KEY_MISSING");
  }
  return key;
}

/**
 * Performs research using Google Search grounding.
 * Uses gemini-3-pro-preview for complex reasoning and search tasks.
 */
export async function askResearchQuestion(question: string, context: string, overrideKey?: string) {
  const apiKey = getApiKey(overrideKey);
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Current Project Context:\n${context}\n\nResearch Inquiry: ${question}`,
      config: {
        systemInstruction: "You are an expert researcher. Provide factual, concise information. Use Markdown for structuring data.",
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
    console.error("AI Research Error:", error);
    throw error;
  }
}

/**
 * Synthesizes project notes and research into a structured outline.
 * Uses gemini-3-pro-preview for advanced reasoning.
 */
export async function weaveProjectOutline(
  notes: { content: string; timestamp: number }[],
  research: string[],
  overrideKey?: string
) {
  const apiKey = getApiKey(overrideKey);
  const ai = new GoogleGenAI({ apiKey });

  // Sort notes by timestamp descending (newest first) to prioritize recent entries
  const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);
  const notesContext = sortedNotes.map(n => n.content).join('\n---\n');
  const researchContext = research.join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Project Notes (Newest First):\n${notesContext}\n\nExternal Research Context:\n${researchContext}\n\nTask: Synthesize this data into a coherent, structured project brief. Newer notes should take precedence if there are contradictions.`,
      config: {
        systemInstruction: "You are a senior project architect. Create a professional, detailed markdown outline based on the provided inputs. Organize logically with clear headings.",
      },
    });

    return { text: response.text || "" };
  } catch (error: any) {
    console.error("Weave Error:", error);
    throw error;
  }
}

/**
 * Generates an image based on project concepts.
 * Uses gemini-2.5-flash-image for general generation.
 */
export async function generateProjectImage(prompt: string, overrideKey?: string) {
  const apiKey = getApiKey(overrideKey);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Find the image part in the response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from visual model.");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

/**
 * Analyzes and breaks down raw text into atomic project notes.
 * Uses gemini-3-pro-preview with JSON response schema.
 */
export async function shredWallOfText(text: string, overrideKey?: string) {
  const apiKey = getApiKey(overrideKey);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Break down the following text into atomic, structured project notes:\n\n${text}`,
      config: {
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
              links: { type: Type.ARRAY, items: { type: Type.STRING } },
              is_priority: { type: Type.BOOLEAN },
              raw_source_id: { type: Type.STRING }
            },
            required: ["title", "content", "category"]
          }
        },
        systemInstruction: "You are a knowledge architect. Extract structured information from raw text into a JSON array of atomic notes.",
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Shredding Error:", error);
    throw error;
  }
}
