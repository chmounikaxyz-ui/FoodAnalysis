import { NutritionalInfo } from "../types";

// All AI calls go through the server so the API key stays server-side

export interface ClarifyResult {
  isFood: boolean;
  foodName: string;
  questions: string[];
}

export async function clarifyFoodImage(base64Image: string, mimeType: string): Promise<ClarifyResult> {
  const res = await fetch("/api/ai/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ base64Image, mimeType }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}): ${res.statusText}`);
  }

  if (!res.ok) throw new Error(data.error || "Failed to identify food");
  return data as ClarifyResult;
}

export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string,
  userAnswers?: string
): Promise<NutritionalInfo> {
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ base64Image, mimeType, userAnswers }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}): ${res.statusText}`);
  }

  if (!res.ok) throw new Error(data.error || "Failed to analyze image");
  return data as NutritionalInfo;
}

export async function getNutritionChatResponse(
  message: string,
  history: { role: "user" | "model"; parts: string }[]
): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Chat request failed");
  }

  return data.text ?? "I couldn't generate a response. Please try again.";
}
