
import { GoogleGenAI } from "@google/genai";

// We initialize inside functions to ensure the most up-to-date API key 
// (especially when using the BYOK dialog window.aistudio.openSelectKey)
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function askResearchQuestion(question: string, context: string = "") {
  const ai = getClient();
  const prompt = `
    I am working on a project. 
    Current context of my project: "${context}"
    
    Question: "${question}"
    
    Please provide a concise, factual, and helpful answer for my research. 
    Use the search tool to verify facts.
    Keep the response focused on helping me advance my project.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Sorry, I couldn't generate an answer.";
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter((uri: string | undefined): uri is string => !!uri) || [];

    return { text, urls };
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateProjectImage(prompt: string) {
  const ai = getClient();
  try {
    // High-quality generation using Gemini 3 Pro Image
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A high-quality artistic concept visualization of: ${prompt}. Cinematic lighting, detailed texture, professional composition.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
        tools: [{ googleSearch: {} }] // Pro image model supports web search for better accuracy
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function weaveProjectOutline(notepadNotes: {content: string, timestamp: number}[], researchNotes: string[]) {
  const ai = getClient();
  const sortedNotes = [...notepadNotes].sort((a, b) => b.timestamp - a.timestamp);
  
  const prompt = `
    TASK: Construct a comprehensive, structured outline for a project/novel.
    
    INPUT 1: BRAINSTORMING NOTES (Ordered newest to oldest)
    ---
    ${sortedNotes.map(n => `[Entry Date: ${new Date(n.timestamp).toLocaleString()}]\n${n.content}`).join('\n---\n')}
    ---
    
    INPUT 2: VERIFIED RESEARCH DATA (Use this to corroborate or correct the brainstorming notes)
    ---
    ${researchNotes.join('\n---\n')}
    ---
    
    INSTRUCTIONS:
    1. Organize the brainstorming into a logical, hierarchical structure.
    2. PRIORITIZE THE NEWER notes if conflicts arise.
    3. Correct contradictions with research data and add a [CORRECTED] note.
    4. Provide the result in a clean, readable text format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 8000 }
      },
    });

    return { text: response.text || "The loom failed to weave a structure." };
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    console.error("Outline Weave Error:", error);
    throw error;
  }
}
