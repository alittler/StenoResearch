
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Shreds a "Wall of Text" into structured atomic notes using Gemini 3 Pro.
 * Adheres to strict classification logic and the "Raw" rule for content preservation.
 */
export async function shredWallOfText(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: text,
      config: {
        systemInstruction: `
          As the "Knowledge Architect", your goal is to ingest a "Wall of Text" (LLM chats, research, jots, or images-to-text) and transform it into an organized, relational database structure.

          ### 1. ANALYSIS PHASE
          - Identify distinct "Atomic Notes" (singular thoughts, facts, or scenes).
          - Detect specific Project Tags (e.g., #BookTitle, #CharacterName).
          - Extract all Referenced URLs and provide a 1-sentence context for each.
          - Identify "Entities" (People, Places, Technical Concepts).

          ### 2. CLASSIFICATION LOGIC
          Assign every "shredded" note to one of these categories:
          - MANUSCRIPT: Actual prose for a book.
          - CHARACTER: Descriptions, arcs, or dialogue notes.
          - WORLD-BUILDING: Lore, maps, or rules of the setting.
          - RESEARCH: Facts, data, or external links.
          - BRAINSTORM: Loose ideas or "future-me" notes.

          ### 3. THE "RAW" RULE
          Never summarize the core content so much that detail is lost. Preserve the "voice" of the original text while stripping out LLM filler (e.g., "Certainly! Here is...").

          ### 4. OUTPUT FORMAT
          Return a strict JSON array.

          ### 5. CHRONOLOGICAL AUTHORITY
          If the input text implies updates or changes to existing knowledge, the information appearing later in the sequence (more recent) has absolute authority and overrides previous descriptions.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              raw_source_id: { 
                type: Type.STRING, 
                description: "A unique hash or ID for the specific chunk of source text." 
              },
              title: { 
                type: Type.STRING, 
                description: "A concise 5-8 word summary of the atomic note." 
              },
              content: { 
                type: Type.STRING, 
                description: "The cleaned, formatted Markdown text preserving original detail." 
              },
              category: { 
                type: Type.STRING,
                enum: ['MANUSCRIPT', 'CHARACTER', 'WORLD-BUILDING', 'RESEARCH', 'BRAINSTORM']
              },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Detected #tags without the hash symbol."
              },
              links: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    url: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["url", "description"]
                }
              },
              is_priority: { 
                type: Type.BOOLEAN,
                description: "True if the text contains action items or urgent ideas."
              }
            },
            required: ["raw_source_id", "title", "content", "category", "tags", "links", "is_priority"]
          }
        }
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Architect Error:", error);
    throw error;
  }
}

/**
 * Performs research using Google Search grounding for recent and up-to-date information.
 */
export async function askResearchQuestion(question: string, context: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context from my existing project notes:\n${context}\n\nResearch Question: ${question}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return {
      text: response.text || "",
      urls: urls,
    };
  } catch (error) {
    console.error("Research Error:", error);
    throw error;
  }
}

/**
 * Synthesizes data into a structured project outline.
 */
export async function weaveProjectOutline(notepadNotes: { content: string; timestamp: number }[], researchNotes: string[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const notesContext = notepadNotes
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(n => `[Note at ${new Date(n.timestamp).toISOString()}]: ${n.content}`)
      .join('\n\n');
    const researchContext = researchNotes.join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Synthesize this into a Markdown outline.\n\nNOTES:\n${notesContext}\n\nRESEARCH:\n${researchContext}`,
      config: {
        systemInstruction: "You are a master architect. Build a logical hierarchy. CRITICAL AUTHORITY RULE: When information conflicts or overlaps, the notes with the most recent timestamps have absolute authority and override older ones. Prioritize recent entries in the structural layout.",
      },
    });

    return { text: response.text || "" };
  } catch (error) {
    console.error("Outline Error:", error);
    throw error;
  }
}

/**
 * Generates project concept images.
 */
export async function generateProjectImage(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
      },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned.");
  } catch (error) {
    console.error("Visualizer Error:", error);
    throw error;
  }
}
