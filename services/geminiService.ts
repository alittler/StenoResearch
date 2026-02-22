
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import Groq from "groq-sdk";

/**
 * AI Service for Project Ledger.
 * Supports both Gemini and Groq.
 */
const getGeminiAI = () => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const getGroqAI = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
};

/**
 * Executes a research inquiry. 
 * Uses Gemini with Search Grounding if available, otherwise falls back to Groq.
 */
export async function askResearchQuestion(question: string, context: string) {
  const gemini = getGeminiAI();
  
  if (gemini) {
    try {
      const response: GenerateContentResponse = await gemini.models.generateContent({
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
        text: response.text || "No data synthesized.",
        urls: Array.from(new Set(urls))
      };
    } catch (error: any) {
      console.error("Gemini Research Error:", error);
      // If Gemini fails due to credentials, try Groq if available
      if (!getGroqAI()) throw error;
    }
  }

  const groq = getGroqAI();
  if (groq) {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a research assistant. Provide concise, factual answers. Since you don't have live web access, rely on your training data but be precise." },
        { role: "user", content: `Context: ${context}\n\nInquiry: ${question}` }
      ],
      model: "llama-3.3-70b-versatile",
    });

    return {
      text: chatCompletion.choices[0]?.message?.content || "No data synthesized.",
      urls: []
    };
  }

  throw new Error("API_KEY_MISSING");
}

/**
 * Synthesizes multiple notes and optional research into a professional project outline.
 */
export async function weaveProjectOutline(notes: { content: string, timestamp: number }[], research: string[] = []) {
  const gemini = getGeminiAI();
  const groq = getGroqAI();
  const formattedNotes = notes.map(n => `[${new Date(n.timestamp).toISOString()}] ${n.content}`).join('\n---\n');
  const researchContext = research.length > 0 ? `\n\nRESEARCH DISCOVERIES:\n${research.join('\n---\n')}` : '';
  const prompt = `Organize the following project records and research into a logical, hierarchical roadmap:\n\nPROJECT RECORDS:\n${formattedNotes}${researchContext}`;

  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "Create a structured project outline in Markdown. Identify milestones and blockers.",
        }
      });
      return { text: response.text || "Synthesis failed." };
    } catch (error) {
      if (!groq) throw error;
    }
  }

  if (groq) {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Create a structured project outline in Markdown. Identify milestones and blockers." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
    });
    return { text: chatCompletion.choices[0]?.message?.content || "Synthesis failed." };
  }

  throw new Error("API_KEY_MISSING");
}

/**
 * Generates a visual conceptual sketch for the project.
 * (Gemini only feature)
 */
export async function generateProjectImage(prompt: string) {
  const gemini = getGeminiAI();
  if (!gemini) throw new Error("API_KEY_MISSING");

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A professional concept design sketch for: ${prompt}. Minimalist, charcoal on white paper style.` }]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
}

/**
 * Deconstructs raw text into structured atomic notes.
 */
export async function shredWallOfText(text: string) {
  const gemini = getGeminiAI();
  const groq = getGroqAI();

  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
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
      return JSON.parse(response.text || "[]");
    } catch (error) {
      if (!groq) throw error;
    }
  }

  if (groq) {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Convert the input into a JSON array of project tasks/insights. Each object must have: title, content, category, is_priority. Return ONLY the JSON array." },
        { role: "user", content: text }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    const content = chatCompletion.choices[0]?.message?.content || "[]";
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : (parsed.tasks || parsed.insights || []);
    } catch {
      return [];
    }
  }

  throw new Error("API_KEY_MISSING");
}
