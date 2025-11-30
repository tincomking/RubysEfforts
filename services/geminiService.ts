import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROMPT_SYSTEM = `
You are an expert English tutor specializing in preparing students for Singapore University Entrance Exams (similar to advanced IELTS/SAT/TOEFL academic levels).
Your persona is encouraging and precise.
`;

export const generateDailyWords = async (existingWords: string[] = [], count: number = 10): Promise<Word[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Generate ${count} advanced English vocabulary word(s) suitable for academic success in a Singaporean university.
    
    Rules:
    1. Words must be distinct and not in this list of already learned words: ${existingWords.slice(-50).join(', ')}.
    2. Words should be challenging but useful for academic writing (verbs, adjectives, abstract nouns).
    3. Include a 'quiz_sentence' which is a new sentence using the word, but replace the target word with '_______'.
    4. Include 'options' array with 4 options: the correct word and 3 plausible distractors (similar spelling or meaning).
    5. Return purely JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: PROMPT_SYSTEM,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The vocabulary word" },
              definition: { type: Type.STRING, description: "A concise, clear definition" },
              example: { type: Type.STRING, description: "A sentence using the word in an academic context" },
              phonetic: { type: Type.STRING, description: "Phonetic pronunciation e.g. /wɜːrd/" },
              quiz_sentence: { type: Type.STRING, description: "A sentence with the word replaced by _______" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 4 options including the correct word" 
              }
            },
            required: ["word", "definition", "example", "phonetic", "quiz_sentence", "options"]
          }
        }
      }
    });

    if (response.text) {
      const words = JSON.parse(response.text) as Word[];
      return words;
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback in case of API failure - only used if count is small/testing, or retry logic needed
    if (count === 1) {
       return [{
        word: "Resilient",
        definition: "Able to withstand or recover quickly from difficult conditions.",
        example: "The economy proved to be resilient despite the global crisis.",
        phonetic: "/rɪˈzɪliənt/",
        quiz_sentence: "She is _______ and never gives up easily.",
        options: ["resilient", "reticent", "redundant", "resplendent"]
       }];
    }
    return [
      { 
        word: "Alleviate", 
        definition: "To make suffering, deficiency, or a problem less severe.", 
        example: "The government implemented new policies to alleviate poverty.", 
        phonetic: "/əˈliːvieɪt/",
        quiz_sentence: "He took aspirin to _______ his headache.",
        options: ["alleviate", "aggravate", "allocate", "alienate"]
      },
      { 
        word: "Pragmatic", 
        definition: "Dealing with things sensibly and realistically.", 
        example: "We need a pragmatic approach to solving the housing crisis.", 
        phonetic: "/præɡˈmætɪk/",
        quiz_sentence: "Her _______ solution saved the company time and money.",
        options: ["pragmatic", "dogmatic", "erratic", "dramatic"]
      },
    ];
  }
};

export const getPronunciation = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Gemini returns raw PCM data in the inlineData
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
};