
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * Initialize the AI client using the mandatory environment variable.
 * Must use process.env.API_KEY directly as per senior engineering guidelines.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API_KEY is not defined in the environment. Please add it to your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeEnrollmentForm = async (base64Image: string): Promise<any> => {
  const ai = getAI();
  // Using gemini-3-flash-preview for high-speed OCR and reliable data extraction
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
    const text = response.text;
    if (!text) throw new Error("Received empty response from the AI model.");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", response.text);
    throw new Error("The AI could not extract clear information from this document. Please try a higher quality scan.");
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
    text: response.text || "I'm sorry, I encountered an issue generating a response.",
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
