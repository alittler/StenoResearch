
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
 * Uses Gemini with Search Grounding and URL Context if available.
 */
export async function searchIntel(question: string, context: string, urls: string[] = []) {
  const gemini = getGeminiAI();
  
  if (gemini) {
    try {
      const tools: any[] = [{ googleSearch: {} }];
      if (urls.length > 0) {
        tools.push({ urlContext: {} });
      }

      const response: GenerateContentResponse = await gemini.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `NOTEBOOK ENTRIES (PRIMARY SOURCE):\n${context}\n\nUSER INQUIRY: ${question}${urls.length > 0 ? `\n\nFOCUS URLS:\n${urls.join('\n')}` : ''}`,
        config: {
          systemInstruction: "You are a research assistant. You are grounded in the provided 'NOTEBOOK ENTRIES' and 'FOCUS URLS' (if provided). Use Google Search to supplement this data. Cite both notebook entries and web sources.",
          tools,
        },
      });

      const foundUrls: string[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) foundUrls.push(chunk.web.uri);
        });
      }

      return {
        answer: response.text || "No data synthesized.",
        urls: Array.from(new Set(foundUrls))
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
      answer: chatCompletion.choices[0]?.message?.content || "No data synthesized.",
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
export async function shredText(text: string, context: string = "") {
  const gemini = getGeminiAI();
  const groq = getGroqAI();

  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Convert this raw input into a JSON array of project tasks/insights. Use the existing context if helpful:\n\nCONTEXT:\n${context}\n\nRAW INPUT:\n${text}`,
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

/**
 * Fetches the title of a URL using Gemini's URL Context tool.
 */
export async function fetchUrlTitle(url: string) {
  const gemini = getGeminiAI();
  if (!gemini) throw new Error("API_KEY_MISSING");

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `What is the title of the article at this URL: ${url}`,
      config: {
        systemInstruction: "You are a helpful assistant. Provide ONLY the main title of the article or page content at the provided URL. Do not include the website name unless it is part of the article title. No other text.",
        tools: [{ urlContext: {} }]
      }
    });
    return response.text?.trim() || url;
  } catch (error) {
    console.error("Failed to fetch URL title:", error);
    return url;
  }
}

/**
 * Conversational interface grounded in the notebook context.
 */
export async function chatWithNotebook(message: string, context: string, history: { role: 'user' | 'model', text: string }[] = []) {
  const gemini = getGeminiAI();
  if (!gemini) throw new Error("API_KEY_MISSING");

  const contents = [
    { role: 'user', parts: [{ text: `NOTEBOOK CONTEXT:\n${context}` }] },
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await gemini.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: "You are a project assistant. You are grounded in the 'NOTEBOOK CONTEXT'. Answer questions about the project, suggest connections between notes, and help the user brainstorm. Be concise and professional.",
    }
  });

  return response.text || "I couldn't process that request.";
}

/**
 * Generates suggested questions based on the notebook context.
 */
export async function generateSuggestedQuestions(context: string) {
  const gemini = getGeminiAI();
  if (!gemini) return [];

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these project notes, what are 3 insightful questions a user might want to ask to explore the project further?\n\nNOTES:\n${context}`,
      config: {
        systemInstruction: "Provide ONLY a JSON array of 3 strings. No other text.",
        responseMimeType: "application/json",
      }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [];
  }
}

/**
 * Generates a NotebookLM-style guide (Briefing Doc, FAQ, Study Guide).
 */
export async function generateNotebookGuide(context: string, type: 'briefing' | 'faq' | 'study_guide') {
  const gemini = getGeminiAI();
  if (!gemini) throw new Error("API_KEY_MISSING");

  const prompts = {
    briefing: "Create a comprehensive Briefing Document based on these notes. Summarize key themes, entities, and timelines.",
    faq: "Create a Frequently Asked Questions (FAQ) document based on these notes. Anticipate what a stakeholder would ask.",
    study_guide: "Create a Study Guide based on these notes. Identify core concepts, definitions, and key takeaways."
  };

  const response = await gemini.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${prompts[type]}\n\nNOTES:\n${context}`,
    config: {
      systemInstruction: "You are a professional analyst. Create a structured, high-quality document in Markdown.",
    }
  });

  return response.text || "Generation failed.";
}

/**
 * Summarizes a specific source URL.
 */
export async function summarizeSource(url: string) {
  const gemini = getGeminiAI();
  if (!gemini) throw new Error("API_KEY_MISSING");

  const response = await gemini.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize the content of this URL in 3-5 bullet points:\n\n${url}`,
    config: {
      systemInstruction: "You are a helpful assistant. Provide a concise summary of the provided URL.",
      tools: [{ urlContext: {} }]
    }
  });

  return response.text || "Summary failed.";
}
