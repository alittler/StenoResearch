
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Analyzes how well a collection of notes supports the core concept.
 */
export async function auditConceptAlignment(concept: string, notes: { id: string, content: string }[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const notesContext = notes.map(n => `ID:${n.id} | Content:${n.content}`).join('\n---\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        CORE CONCEPT: ${concept}
        
        NOTES TO AUDIT:
        ${notesContext}
      `,
      config: {
        systemInstruction: `
          You are a Content Auditor. Evaluate how each note relates to the Core Concept.
          Assign an alignmentScore (0-100) and a brief justification.
          Identify "Gaps" (areas the concept claims to cover but notes don't support) and "Drift" (notes that don't fit the concept).
          Return valid JSON.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            noteAlignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["id", "score", "reasoning"]
              }
            },
            overallAnalysis: { type: Type.STRING },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["noteAlignments", "overallAnalysis", "gaps"]
        }
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("Audit Error:", error);
    throw error;
  }
}

/**
 * Shreds a "Wall of Text" into structured atomic notes using Gemini 3 Pro.
 */
export async function shredWallOfText(text: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: text,
      config: {
        systemInstruction: `
          As the "Knowledge Architect", transform the "Wall of Text" into structured notes.
          OMIT ALL CONVERSATIONAL FILLER, PREFACES, OR INTRODUCTORY REMARKS. Start directly with the data.

          ### CLASSIFICATION LOGIC
          - MANUSCRIPT: Actual prose.
          - CHARACTER: Descriptions or arcs.
          - WORLD-BUILDING: Lore or rules.
          - RESEARCH: Facts or links.
          - BRAINSTORM: Loose ideas.

          Return a strict JSON array.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              raw_source_id: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                enum: ['MANUSCRIPT', 'CHARACTER', 'WORLD-BUILDING', 'RESEARCH', 'BRAINSTORM']
              },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
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
              is_priority: { type: Type.BOOLEAN }
            },
            required: ["raw_source_id", "title", "content", "category", "tags", "links", "is_priority"]
          }
        }
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("Architect Error:", error);
    throw error;
  }
}

/**
 * Summarizes a long question/prompt into a concise one-line heading.
 */
export async function summarizePrompt(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize this research prompt into a concise one-line title (max 10 words). Omit all prefaces.\n\nPrompt: ${prompt}`,
    });
    return response.text.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error("Summarization Error:", error);
    return prompt.slice(0, 50) + "...";
  }
}

/**
 * Performs research using Google Search grounding.
 */
export async function askResearchQuestion(question: string, context: string, imageData?: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [
      { text: `Context from my existing project notes:\n${context}\n\nResearch Question: ${question}` }
    ];

    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.split(',')[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: "You are a professional researcher. OMIT ALL PREFACES, INTRODUCTIONS, AND CONVERSATIONAL FILLER. Start directly with the factual information. Be concise and authoritative.",
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
      contents: `Synthesize this into a Markdown outline. OMIT ALL PREFACES.\n\nNOTES:\n${notesContext}\n\nRESEARCH:\n${researchContext}`,
      config: {
        systemInstruction: "You are a master architect. Build a logical hierarchy. CRITICAL AUTHORITY RULE: Most recent entries have absolute authority. Omit conversational introductions.",
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
