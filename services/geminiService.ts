
import { GoogleGenAI } from "@google/genai";

// Create a fresh instance for every call to ensure the latest API_KEY is used.
// We use a safe getter to prevent the application from crashing if process.env is undefined.
const getAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : '';
  return new GoogleGenAI({ apiKey });
};

export async function askResearchQuestion(question: string, context: string = "") {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Project Context: ${context}
        Query: ${question}
        Provide a concise, professional research finding. Use grounding where possible.
      `,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No findings discovered.";
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A professional concept sketch for a project: ${prompt}. Cinematic lighting, architectural style.` }]
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
    throw new Error("Image part not found in response.");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function weaveProjectOutline(notepadNotes: {content: string}[], researchNotes: string[]) {
  try {
    const ai = getAI();
    const prompt = `
      Create a structured project brief/outline.
      Input Notes: ${notepadNotes.map(n => n.content).join('\n---\n')}
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
    console.error("Outline Synthesis Error:", error);
    throw error;
  }
}
