
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Performs research using Google Search grounding.
 * Uses project context to provide relevant data for the specific project.
 */
export async function askResearchQuestion(question: string, context: string) {
  // Use the injected process.env.API_KEY exclusively as per guidelines
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  // Always create a new instance right before the call
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

    // Extract grounding URLs for the UI
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
 */
export async function weaveProjectOutline(notes: {content: string, timestamp: number}[], research: string[]) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  
  const ai = new GoogleGenAI({ apiKey });

  // Format entries with timestamps to help the model prioritize newer info
  const ledgerText = notes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n---\n');
  const researchText = research.join('\n---\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `LEDGER ENTRIES:\n${ledgerText}\n\nRESEARCH CONTEXT:\n${researchText}\n\nTASK: Generate a professional, logically structured project outline. Prioritize information from more recent ledger entries if conflicts arise.`,
      config: {
        systemInstruction: "You are a senior project architect. Synthesize messy logs and research into a clean, actionable project briefing. Use Markdown.",
      }
    });

    return { text: response.text || "Outline generation failed to produce content." };
  } catch (error) {
    console.error("Outline Synthesis Error:", error);
    throw error;
  }
}

/**
 * Generates an image representing a project concept using Gemini image generation.
 */
export async function generateProjectImage(prompt: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    // Per guidelines, iterate parts to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model.");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

/**
 * Shreds unstructured text into structured, atomic project records using JSON schema.
 */
export async function shredWallOfText(text: string) {
  const apiKey = process.env.API_KEY;
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
              title: { type: Type.STRING, description: "Atomic note title" },
              content: { type: Type.STRING, description: "Core note details" },
              category: { type: Type.STRING, description: "Category (e.g., Idea, Research, Task)" },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              links: { type: Type.ARRAY, items: { type: Type.STRING } },
              is_priority: { type: Type.BOOLEAN },
              raw_source_id: { type: Type.STRING }
            },
            required: ['title', 'content', 'category']
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Text Shredder Error:", error);
    throw error;
  }
}
