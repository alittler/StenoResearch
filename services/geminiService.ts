
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Helper to extract meaningful error messages from Gemini API errors
 */
function handleApiError(error: any): never {
  console.error("Gemini API Error:", error);
  let message = error.message || "";
  let status = error.status;

  try {
    if (message.startsWith('{')) {
      const parsed = JSON.parse(message);
      message = parsed.error?.message || message;
      status = parsed.error?.code || status;
    }
  } catch (e) { /* ignore */ }

  if (status === 429 || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("QUOTA_EXCEEDED");
  }
  throw new Error(message || "An unexpected network error occurred.");
}

/**
 * RESEARCH: Uses Gemini 3 Flash for speed and search grounding.
 */
export async function askResearchQuestion(question: string, context: string, apiKeyOverride?: string): Promise<{ text: string, urls: string[] }> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Project Context: ${context}\n\nResearch Inquiry: ${question}`,
      config: {
        systemInstruction: "You are an expert researcher. Use Google Search to find current data. Be concise and factual.",
        tools: [{ googleSearch: {} }],
      },
    });

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return {
      text: response.text || "No data found.",
      urls: Array.from(new Set(urls)),
    };
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * OUTLINE SYNTHESIS: Uses Gemini 3 Pro for complex reasoning and synthesis of multiple notes.
 */
export async function weaveProjectOutline(
  notepadNotes: { content: string; timestamp: number }[],
  researchNotes: string[],
  apiKeyOverride?: string
): Promise<{ text: string }> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  
  // Format the inputs for the model to understand chronological order and research context.
  const prompt = `
    Synthesize the following project notes and research findings into a cohesive project outline.
    Prioritize newer notes based on timestamps if there are conflicts.
    
    Notepad Entries:
    ${notepadNotes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n')}
    
    Research Context:
    ${researchNotes.join('\n')}
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a master strategist. Create a logical, structured project outline in Markdown format based on provided data. Ensure the output is concise but comprehensive.",
      },
    });
    
    return { text: response.text || "" };
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * IMAGE GENERATION: Uses Gemini 2.5 Flash Image to visualize project concepts.
 */
export async function generateProjectImage(prompt: string, apiKeyOverride?: string): Promise<string> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

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

    // Iterate through parts to find the image part
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64Data}`;
        }
      }
    }
    throw new Error("No image was returned by the model.");
  } catch (error: any) {
    handleApiError(error);
  }
}

/**
 * KNOWLEDGE ARCHITECT: Shreds long unstructured text into atomic JSON-structured notes.
 */
export async function shredWallOfText(text: string, apiKeyOverride?: string): Promise<any[]> {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze and shred the following text into atomic, actionable notes:\n\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A short, descriptive title for the note." },
              content: { type: Type.STRING, description: "The core content or insight." },
              category: { type: Type.STRING, description: "A high-level category like 'Idea', 'Research', 'Task', or 'Reference'." },
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
    
    const resultText = response.text || "[]";
    return JSON.parse(resultText.trim());
  } catch (error: any) {
    handleApiError(error);
  }
}
