
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Performs research using Google Search grounding.
 * Uses project context to provide relevant data for the specific project.
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
 * Synthesizes project entries into a cohesive project outline using reasoning models.
 */
export async function weaveProjectOutline(notepadEntries: { content: string, timestamp: number }[], researchEntries: string[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Synthesize the following project notes and research into a cohesive project outline. 
    Prioritize newer notes based on timestamps if there are contradictions.
    
    Notepad Entries:
    ${notepadEntries.sort((a, b) => b.timestamp - a.timestamp).map(e => `[${new Date(e.timestamp).toISOString()}] ${e.content}`).join('\n')}
    
    Research Context:
    ${researchEntries.join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a senior project architect. Create a detailed, structured project outline based on provided notes and research. Use Markdown headers and bullet points. Be concise and technical.",
      }
    });

    return { text: response.text || "Failed to generate outline." };
  } catch (error) {
    console.error("AI Outline Synthesis Error:", error);
    throw error;
  }
}

/**
 * Generates an image representing a project concept using gemini-2.5-flash-image.
 */
export async function generateProjectImage(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("No response from AI");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image part found in the response");
  } catch (error) {
    console.error("AI Image Generation Error:", error);
    throw error;
  }
}

/**
 * Analyzes raw text and fragments it into atomic project notes using structured JSON.
 */
export async function shredWallOfText(text: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze and break down the following text into atomic project notes:\n\n${text}`,
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
        systemInstruction: "Extract atomic project notes and findings from raw text. Organize them into meaningful categories and titles.",
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Text Shredding Error:", error);
    throw error;
  }
}
