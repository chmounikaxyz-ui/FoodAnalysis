export interface NutritionalInfo {
  isFood: boolean;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  healthScore: number; // 0-100
  analysis: string;
  vitamins?: string[];
  glycemicIndex?: "Low" | "Medium" | "High";
  servings?: number;
  estimatedWeight?: number; // in grams
  healthTips?: string[];
}

export interface MealLog {
  id: string;
  timestamp: number;
  info: NutritionalInfo;
  imageUrl?: string;
}

export interface Recipe {
  id: string | number;
  title: string;
  author: string;
  authorInitials?: string;
  image: string;
  description: string;
  healthScore: number;
  calories: number;
  prepTime: string;
  likes?: number;
  comments?: number;
  tags?: string[];
  verified?: boolean;
  servings: number;
  nutrition: { protein: number; carbs: number; fat: number; fiber: number };
  ingredients: Array<{ amount: string; name: string }>;
  steps: Array<{ title: string; description: string }>;
  isCustom?: boolean;
}

export interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  limit: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
