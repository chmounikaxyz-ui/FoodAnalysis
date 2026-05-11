import { GoogleGenAI, Type } from "@google/genai";
import { NutritionalInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeFoodImage(base64Image: string, mimeType: string): Promise<NutritionalInfo> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: "First, strictly verify if the main subject of this image is food. If it is NOT food (e.g., a person giving a presentation, a building, a pet, a document, etc.), set 'isFood' to false, 'foodName' to 'Non-food item', and use the 'analysis' field to politely explain that you can only analyze nutritional content of food. If it IS food, set 'isFood' to true and provide a comprehensive nutrition breakdown including food name, estimated calories, protein (g), carbs (g), fat (g), fiber (g), sugar (g), vitamins/minerals, glycemic index (Low/Medium/High), estimated weight (grams), health score (0-100), and a brief overall analysis. Also provide 3 short actionable health tips based on this meal.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isFood: { type: Type.BOOLEAN },
          foodName: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          sugar: { type: Type.NUMBER },
          vitamins: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          glycemicIndex: { 
            type: Type.STRING,
            enum: ["Low", "Medium", "High"]
          },
          estimatedWeight: { type: Type.NUMBER },
          healthScore: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          healthTips: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["isFood", "foodName", "calories", "protein", "carbs", "fat", "healthScore", "analysis", "healthTips"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  try {
    const cleanJson = response.text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse AI response:", response.text);
    throw new Error("Failed to analyze food image.");
  }
}

export async function getNutritionChatResponse(message: string, history: { role: "user" | "model", parts: string }[]) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history.map(h => ({ 
        role: h.role === "user" ? "user" : "model", 
        parts: [{ text: h.parts }] 
      })),
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: "You are Nru, a friendly and expert AI nutrition assistant. You help users understand nutrition, track their goals, and make healthier food choices. Be concise, evidence-based, and encouraging.",
    },
  });

  return response.text;
}
