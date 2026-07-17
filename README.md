
# 🥗 Nru — AI-Powered Nutrition Tracking Redefined

**Deployed Application:** [https://foodanalysis-0uoa.onrender.com/](https://foodanalysis-0uoa.onrender.com/)

Nru is a modern, premium AI nutrition assistant and wellness tracker. It helps users log meals via photo analysis, sync smart watch health data (Google Fit), track daily macronutrients/hydration, and discover personalized recipes.

It features a **hybrid AI intelligence routing layer** that leverages **local offline machine learning models (Ollama)** when available, falling back to the **Gemini Cloud API** when offline.

---

## ✨ Key Features

### 📸 1. Two-Step AI Food Analysis
* **Visual Detection:** Upload a photo of your meal to instantly identify the dish.
* **Clarifying Questionnaire:** The AI asks 2–3 precise questions (about cooking method, portion size, hidden ingredients) to ensure the nutritional estimate is as accurate as possible.
* **Full Breakdown:** Generates calories, protein, carbs, fats, fiber, sugar, glycemic index (GI), estimated weight, key nutrients, a wellness score, and 3 actionable health tips.

### 🤖 2. Offline Hybrid AI Chat
* **Local Inference:** Queries your local Ollama server. If running (with `qwen2.5:3b` or `llama3`), it runs all chat processing locally on your GPU/CPU, keeping your conversations private and offline.
* **Cloud Fallback:** Automatically falls back to Google's **Gemini API** if your local Ollama server is offline.

### ⌚ 3. Smart Watch Integration (Google Fit)
* Connects to the Google Fit REST API via OAuth 2.0.
* Syncs and aggregates daily activity data, sleep segments, and hydration directly into the dashboard.

### 📊 4. Interactive Dashboard & Metrics
* **Macro Rings:** Visual indicators for Protein, Carbs, and Fats goals.
* **Water Tracker:** Track daily hydration logs with interactive reminder controls.
* **Calorie Trends:** Visual chart showing historical calorie consumption.
* **Active Sleep & Steps:** Syncs live steps and sleep stats from your watch sync.

### 🍳 5. Interactive Recipe Hub
* Discover, save, and filter healthy recipes (Vegan, High-Protein, Gluten-Free, Keto, etc.).
* Review ingredients, preparation instructions, and user reviews.
* Upload your own recipes to the community feed.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (v4), Lucide React, Motion (Framer Motion).
* **Backend:** Node.js, Express, Axios, Cookie-Parser, Bcrypt.js (local session/cookie auth).
* **AI Engine:** Ollama API (Local LLM) / Google Gen AI SDK (`@google/genai`).

---

## 🚀 Getting Started

### 📋 Prerequisites
* **Node.js** (v18 or higher recommended)
* **Ollama** (optional, for local offline AI chat)

---

### 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chmounikaxyz-ui/FoodAnalysis.git
   cd FoodAnalysis
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   # Google Gemini API (For fallback / meal analysis)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Google Fit OAuth Credentials (For smart watch integration)
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here

   # Ollama Configuration (Defaults to http://localhost:11434 if omitted)
   OLLAMA_HOST=http://localhost:11434
   ```

---

### 🏃 Running the Application

1. **Start the local server & Vite development build:**
   ```bash
   npm run dev
   ```
2. **Access the application:** Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### ⚙️ Setting Up Local Offline AI Chat (Ollama)

To use your own local machine learning models for the nutrition chat:

1. Download and install Ollama from **[ollama.com](https://ollama.com)**.
2. Pull a lightweight model (e.g., Qwen 2.5 3B) using your terminal:
   ```bash
   ollama run qwen2.5:3b
   ```
3. Ensure the Ollama background service is running (you will see the tray icon).
4. Run the web app (`npm run dev`). The server will automatically detect Ollama at startup and route chat prompts locally.
