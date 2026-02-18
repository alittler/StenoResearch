
import { GoogleGenAI, Type } from "@google/genai";

/**
 * AI Service for Project Ledger using Google Gemini API.
 */

// Helper to create AI instance using process.env.API_KEY exclusively.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Performs research using Gemini 3 Flash with Search Grounding.
 */
export async function askResearchQuestion(question: string, context: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Project Context:\n${context}\n\nResearch Inquiry: ${question}`,
    config: {
      systemInstruction: "You are an expert project researcher. Provide factual, concise information. Use Markdown for structuring data. Analyze the user's project context to provide tailored insights. Be professional and objective.",
      tools: [{ googleSearch: {} }],
    },
  });

  // Extract search grounding URLs if available from the response groundingMetadata
  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web?.uri)
    .filter(Boolean) || [];

  return {
    text: response.text || "No data received from engine.",
    urls: urls
  };
}

/**
 * Synthesizes notes and research into an outline using Gemini 3 Pro.
 * @param notes Array of notes with content and timestamp.
 * @param research Array of research summaries.
 * @param _manualApiKey Optional parameter kept for signature compatibility with existing calls.
 */
export async function weaveProjectOutline(
  notes: { content: string, timestamp: number }[], 
  research: string[],
  _manualApiKey?: string
) {
  const ai = getAI();
  const notesContext = notes
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(n => n.content)
    .join('\n---\n');
  const researchContext = research.join('\n---\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Synthesize the following project notes and research into a structured outline. Newer notes take precedence during conflict resolution.\n\n### PROJECT NOTES\n${notesContext}\n\n### RESEARCH CONTEXT\n${researchContext}`,
  });

  return {
    text: response.text || "Failed to synthesize outline."
  };
}

/**
 * Generates an image artifact using Gemini 2.5 Flash Image.
 * @param prompt Visual description.
 * @param _manualApiKey Optional parameter kept for signature compatibility with existing calls.
 */
export async function generateProjectImage(prompt: string, _manualApiKey?: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A professional concept visualization of: ${prompt}. High quality, detailed artifact style.` }
      ],
    },
  });

  // Iterate through parts to find the image part (inlineData)
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image data found in response.");
}

/**
 * Shatters a wall of text into atomic, categorized project notes using Gemini 3 Flash and JSON Schema.
 */
export async function shredWallOfText(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Shatter the following text into atomic, categorized project notes:\n\n${text}`,
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
      }
    }
  });

  try {
    const textOutput = response.text || "[]";
    return JSON.parse(textOutput);
  } catch (e) {
    console.error("Failed to parse JSON response", e);
    return [];
  }
}
