
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * Initialize the AI client using the mandatory environment variable.
 * As per guidelines, this must come from process.env.API_KEY.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Ensure process.env.API_KEY is set in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeEnrollmentForm = async (base64Image: string): Promise<any> => {
  const ai = getAI();
  // Using gemini-3-flash-preview for high speed and excellent OCR capabilities
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: "Extract employee details from this enrollment form. Search for Full Name, Email, Role, Department (HR, Engineering, Sales, Marketing, Finance, Legal), and Salary. Return ONLY valid JSON matching the schema.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          email: { type: Type.STRING },
          role: { type: Type.STRING },
          department: { type: Type.STRING },
          salary: { type: Type.NUMBER },
          joinDate: { type: Type.STRING, description: 'ISO format YYYY-MM-DD' }
        },
        required: ["fullName", "email", "role", "department", "salary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response as JSON", response.text);
    throw new Error("Could not parse employee data from form. Please ensure the image is clear and contains employee information.");
  }
};

export const chatWithNexus = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: [{ role: 'user', parts: [{ text: query }] }],
    config: {
      systemInstruction: "You are the Nexus EMS Intelligence Engine. You help HR professionals with workforce analytics, policy explanation, and general management tasks. Be professional, concise, and accurate. Use Google Search grounding for real-time information regarding labor laws or workforce trends.",
      tools: [{ googleSearch: {} }],
    }
  });

  return {
    text: response.text || "I'm sorry, I couldn't generate a response.",
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};
