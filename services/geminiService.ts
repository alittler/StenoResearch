
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

/**
 * AI Service for Project Ledger.
 * Optimized for Vercel AI Gateway integration.
 */
const getAI = () => {
  // Use process.env.API_KEY directly as per guidelines
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING");
  }

  // Initialize with API key from environment
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  return new GoogleGenAI({ 
    apiKey: process.env.API_KEY
  });
};

/**
 * Executes a research inquiry using Google Search Grounding.
 */
export async function askResearchQuestion(question: string, context: string) {
  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${context}\n\nInquiry: ${question}`,
      config: {
        systemInstruction: "You are a research assistant. Provide concise, factual answers based on web data. Cite sources.",
        tools: [{ googleSearch: {} }],
      },
    });

    const urls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) urls.push(chunk.web.uri);
      });
    }

    return {
      // Accessing text property directly as per guidelines
      text: response.text || "No data synthesized.",
      urls: Array.from(new Set(urls))
    };
  } catch (error: any) {
    console.error("Research Error:", error);
    throw error;
  }
}

/**
 * Synthesizes multiple notes and optional research into a professional project outline.
 */
export async function weaveProjectOutline(notes: { content: string, timestamp: number }[], research: string[] = []) {
  try {
    const ai = getAI();
    const formattedNotes = notes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n---\n');
    const researchContext = research.length > 0 ? `\n\nRESEARCH DISCOVERIES:\n${research.join('\n---\n')}` : '';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Organize the following project records and research into a logical, hierarchical roadmap:\n\nPROJECT RECORDS:\n${formattedNotes}${researchContext}`,
      config: {
        systemInstruction: "Create a structured project outline in Markdown. Identify milestones and blockers.",
      }
    });

    // Accessing text property directly
    return { text: response.text || "Synthesis failed." };
  } catch (error: any) {
    console.error("Synthesis Error:", error);
    throw error;
  }
}

/**
 * Generates a visual conceptual sketch for the project.
 */
export async function generateProjectImage(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional concept design sketch for: ${prompt}. Minimalist, charcoal on white paper style.` }]
      }
    });

    // Iterate through candidates and parts to extract the image as per nano banana guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error: any) {
    console.error("Image Error:", error);
    throw error;
  }
}

/**
 * Deconstructs raw text into structured atomic notes.
 */
export async function shredWallOfText(text: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Convert this raw input into a JSON array of project tasks/insights:\n\n${text}`,
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
              is_priority: { type: Type.BOOLEAN }
            },
            required: ["title", "content", "category", "is_priority"]
          }
        }
      }
    });

    // Accessing text property directly
    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Shred Error:", error);
    throw error;
  }
}
