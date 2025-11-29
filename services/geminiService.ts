import { GoogleGenAI } from "@google/genai";
import { UploadedFile, AIModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Helper to strip markdown code blocks
const cleanCodeResponse = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code blocks if present (e.g., ```css ... ```)
  const codeBlockRegex = /^```(?:html|css)?\s*([\s\S]*?)\s*```$/i;
  const match = cleaned.match(codeBlockRegex);
  if (match) {
    cleaned = match[1];
  }
  return cleaned;
};

export const validateCss = (css: string): string[] => {
  const errors: string[] = [];
  
  // Check for balanced braces
  let openBraces = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') openBraces++;
    if (css[i] === '}') openBraces--;
    if (openBraces < 0) {
      errors.push("Found extra closing brace '}'.");
      openBraces = 0; // Reset to continue finding other potential errors
    }
  }
  if (openBraces > 0) {
    errors.push(`Missing ${openBraces} closing brace(s) '}'.`);
  }

  // Check for empty content
  if (!css || css.trim().length === 0) {
    errors.push("Generated CSS is empty.");
  }

  return errors;
};

// --- Ollama Integration ---

export const getOllamaModels = async (): Promise<AIModel[]> => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) return [];
    const data = await response.json();
    return data.models.map((m: any) => ({
      id: m.name,
      name: m.name,
      provider: 'ollama'
    }));
  } catch (error) {
    console.warn("Could not fetch Ollama models. Ensure Ollama is running at http://127.0.0.1:11434");
    return [];
  }
};

const callOllama = async (modelId: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama Call Error:", error);
    throw new Error("Failed to communicate with local Ollama instance.");
  }
};

// --- Main Services ---

export const generateGlobalCss = async (
  files: UploadedFile[],
  userPrompt: string,
  model: AIModel
): Promise<string> => {
  
  const fileContexts = files.map((f, i) => `--- FILE ${i + 1}: ${f.name} ---\n${f.content}\n`).join('\n');

  const prompt = `
    You are a world-class UI/UX designer and Frontend Engineer.
    
    Task: Create a single, modern, global CSS stylesheet that redesigns the provided HTML content based on the user's request.
    
    User Request: "${userPrompt}"
    
    Input HTML Files Context:
    ${fileContexts}
    
    Requirements:
    1. Output ONLY the raw CSS code. Do not output markdown backticks or explanations.
    2. The CSS should be responsive, accessible, and modern (Flexbox/Grid).
    3. THEME: Define a consistent color palette and typography variables at the :root level (e.g., --primary-color, --text-main). Use these variables throughout.
    4. SELECTORS: Use advanced selectors (child '>', sibling '+', general sibling '~') where appropriate to reduce specificity wars and create a cleaner cascade.
    5. ANIMATIONS: Add smooth transitions for interactive elements (hover, focus states for buttons/links) and subtle entrance animations for main content areas.
    6. Ensure specific selectors are created to handle the structures seen in the HTML files.
    7. Do not assume any class names exist; create a robust set of styles that generic HTML elements or likely class names would use.
  `;

  try {
    let responseText = '';

    if (model.provider === 'ollama') {
      responseText = await callOllama(model.id, prompt);
    } else {
      const response = await ai.models.generateContent({
        model: model.id || DEFAULT_GEMINI_MODEL,
        contents: prompt,
      });
      responseText = response.text || '';
    }
    
    return cleanCodeResponse(responseText);
  } catch (error) {
    console.error("Error generating CSS:", error);
    throw new Error(`Failed to generate global CSS using ${model.name}.`);
  }
};

export const rewriteHtmlFile = async (
  file: UploadedFile,
  globalCss: string,
  userPrompt: string,
  model: AIModel
): Promise<string> => {

  const prompt = `
    You are a Frontend Engineering Expert.
    
    Task: Rewrite the provided HTML file to utilize the new Global CSS provided below.
    
    Goal: Apply the user's design intent "${userPrompt}" by restructuring the HTML to match the new CSS.
    
    Global CSS (Reference Only):
    ${globalCss}
    
    Original HTML File (${file.name}):
    ${file.content}
    
    Requirements:
    1. Output ONLY the raw HTML code. Do not output markdown backticks.
    2. Add <link rel="stylesheet" href="style.css"> to the <head>.
    3. Remove any existing internal <style> blocks or inline 'style' attributes.
    4. Add appropriate classes to HTML elements to match the Global CSS selectors.
    5. Maintain all original text content and images. You are changing the structure/styling, not the information.
    6. Ensure the HTML is semantic (use <header>, <main>, <footer>, <section>, etc.).
  `;

  try {
    let responseText = '';

    if (model.provider === 'ollama') {
      responseText = await callOllama(model.id, prompt);
    } else {
      const response = await ai.models.generateContent({
        model: model.id || DEFAULT_GEMINI_MODEL,
        contents: prompt,
      });
      responseText = response.text || '';
    }

    return cleanCodeResponse(responseText);
  } catch (error) {
    console.error(`Error rewriting ${file.name}:`, error);
    throw new Error(`Failed to rewrite HTML for ${file.name}`);
  }
};