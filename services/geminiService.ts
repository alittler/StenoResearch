
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Directly use process.env.API_KEY as per strict requirements.
  const apiKey = process.env.API_KEY;
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
      Current project context from my notes: "${context}"
      My Research Question: "${question}"
      
      Provide a concise, factual, and helpful answer. 
      Use the search tool to verify facts and include citations if possible.
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
    console.error("Research Error:", error);
    throw error;
  }
}

export async function generateProjectImage(prompt: string) {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A professional concept visual for a project ledger: ${prompt}. Detailed, artistic, cinematic lighting.` }]
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
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function weaveProjectOutline(notepadNotes: {content: string, timestamp: number}[], researchNotes: string[]) {
  try {
    const ai = getClient();
    const sortedNotes = [...notepadNotes].sort((a, b) => b.timestamp - a.timestamp);
    
    const prompt = `
      Create a highly structured project outline based on the following data.
      User Notes (Newest first): ${sortedNotes.map(n => n.content).join('\n---\n')}
      Secondary Research: ${researchNotes.join('\n---\n')}
      
      Structure the outline logically with headings, subheadings, and key takeaways.
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
    console.error("Outline Synthesis Error:", error);
    throw error;
  }
}
