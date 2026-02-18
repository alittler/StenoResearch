
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Performs research using Google Search grounding.
 * Uses gemini-3-flash-preview for best efficiency and TPM.
 */
export async function askResearchQuestion(question: string, context: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  } catch (error) {
    console.error("AI Research Error:", error);
    throw error;
  }
}

/**
 * Synthesizes notes and research into a cohesive project outline.
 */
export async function weaveProjectOutline(notes: { content: string, timestamp: number }[], research: string[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const sortedNotes = [...notes].sort((a, b) => b.timestamp - a.timestamp);
    const notesCtx = sortedNotes.map(n => `- ${n.content}`).join('\n');
    const researchCtx = research.join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Project Notes:\n${notesCtx}\n\nResearch Context:\n${researchCtx}`,
      config: {
        systemInstruction: "You are a professional project architect. Synthesize the provided notes and research into a logical, hierarchical project outline. Prioritize information from more recent notes if conflicts occur. Use Markdown for clear structure.",
      },
    });

    return { text: response.text || "" };
  } catch (error) {
    console.error("AI Synthesis Error:", error);
    throw error;
  }
}

/**
 * Generates a concept visualization image based on a prompt.
 */
export async function generateProjectImage(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model.");
  } catch (error) {
    console.error("AI Image Generation Error:", error);
    throw error;
  }
}

/**
 * Processes a wall of text into structured, atomic notes.
 */
export async function shredWallOfText(text: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Process the following raw text into a list of atomic project notes:\n\n${text}`,
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
            },
            required: ["title", "content", "category"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("AI Text Shredding Error:", error);
    throw error;
  }
}
