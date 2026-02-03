
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * World-class initialization logic.
 * We initialize the AI instance inside the service calls to ensure 
 * we always use the most up-to-date API key from process.env.API_KEY.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEnrollmentForm = async (base64Image: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: "Extract employee details from this enrollment form. Look for Full Name, Email, Role, Department, and Salary. Output strictly as JSON.",
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
          joinDate: { type: Type.STRING, description: 'YYYY-MM-DD format' }
        },
        required: ["fullName", "email", "role", "department", "salary"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const chatWithEMS = async (query: string) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are the Nexus EMS Assistant. You help HR managers manage employees, explain company policies, and analyze workforce data. Be professional and helpful.",
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  const response = await chat.sendMessage({ message: query });
  return response.text;
};

export const searchGroundingInfo = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateTTS = async (text: string): Promise<string> => {
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
