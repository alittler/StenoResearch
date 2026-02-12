
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const manualKey = localStorage.getItem('steno_manual_key');
  // Use process.env.API_KEY as the fallback as per standard SDK instructions
  const apiKey = manualKey || (typeof process !== 'undefined' ? process.env.API_KEY : undefined);
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  
  return new GoogleGenAI({ apiKey: apiKey });
};

export async function askResearchQuestion(question: string, context: string = "") {
  try {
    const ai = getClient();
    const prompt = `
      I am working on a project. 
      Current context of my project: "${context}"
      
      Question: "${question}"
      
      Please provide a concise, factual, and helpful answer for my research. 
      Use the search tool to verify facts.
      Keep the response focused on helping me advance my project.
    `;

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
    if (error.message === "API_KEY_MISSING" || error.message?.includes("Requested entity was not found") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateProjectImage(prompt: string) {
  try {
    const ai = getClient();
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
        tools: [{ googleSearch: {} }] 
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING" || error.message?.includes("Requested entity was not found") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function weaveProjectOutline(notepadNotes: {content: string, timestamp: number}[], researchNotes: string[]) {
  try {
    const ai = getClient();
    const sortedNotes = [...notepadNotes].sort((a, b) => b.timestamp - a.timestamp);
    
    const prompt = `
      TASK: Construct a comprehensive, structured outline for a project/novel.
      
      INPUT 1: BRAINSTORMING NOTES (Ordered newest to oldest)
      ---
      ${sortedNotes.map(n => `[Entry Date: ${new Date(n.timestamp).toLocaleString()}]\n${n.content}`).join('\n---\n')}
      ---
      
      INPUT 2: VERIFIED RESEARCH DATA
      ---
      ${researchNotes.join('\n---\n')}
      ---
      
      INSTRUCTIONS:
      1. Organize the brainstorming into a logical, hierarchical structure.
      2. PRIORITIZE THE NEWER notes.
      3. Provide result in clean text format.
    `;

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
    if (error.message === "API_KEY_MISSING" || error.message?.includes("Requested entity was not found") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    console.error("Outline Weave Error:", error);
    throw error;
  }
}
