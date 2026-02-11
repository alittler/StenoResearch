
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function askResearchQuestion(question: string, context: string = "") {
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
      model: 'gemini-3-flash-preview',
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
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function weaveProjectOutline(notepadNotes: {content: string, timestamp: number}[], researchNotes: string[]) {
  // Sort notes to ensure the model knows the temporal order
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
    1. Organize the brainstorming into a logical, hierarchical structure (e.g., Acts, Chapters, or Phases).
    2. IMPORTANT OVERRIDE RULE: If details within the brainstorming notes conflict, always prioritize the NEWER notes (those at the top of the list). Newer notes represent updated decisions or corrections.
    3. IMPORTANT RESEARCH RULE: If a detail in the brainstorming contradicts the research data, correct it in the outline and add a small [CORRECTED] note.
    4. Fill in narrative or logical gaps using the search tool if necessary to ensure high quality.
    5. Provide the result in a clean, readable text format suitable for a typewriter aesthetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 8000 } // Higher budget for complex synthesis
      },
    });

    const text = response.text || "The loom failed to weave a structure.";
    return { text };
  } catch (error) {
    console.error("Outline Weave Error:", error);
    throw error;
  }
}

// Deprecated old weaveStory but keeping for compatibility if needed elsewhere
export async function weaveStory(keywords: string) {
  const prompt = `Generate interconnected plotlines for a novel based on: [${keywords}]`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return { text: response.text || "", urls: [] };
  } catch (error) { return { text: "Error weaving.", urls: [] }; }
}
