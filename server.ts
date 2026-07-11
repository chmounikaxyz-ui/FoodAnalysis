import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import axios from "axios";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // load .env.local first (higher priority)
dotenv.config();                       // fallback to .env for anything not in .env.local

// ── Auth store ────────────────────────────────────────────────────────────────
const USERS_FILE = path.join(process.cwd(), ".users.json");

interface StoredUser {
  name: string;
  email: string;
  passwordHash: string;
}

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (e) { console.error("[Auth] Failed to load users:", e); }
  return [];
}

function saveUsers(users: StoredUser[]) {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8"); }
  catch (e) { console.error("[Auth] Failed to save users:", e); }
}

function findUser(email: string): StoredUser | undefined {
  if (typeof email !== "string") return undefined;
  const target = email.trim().toLowerCase();
  return loadUsers().find(u => u.email.trim().toLowerCase() === target);
}

// ── Session store (persisted in JSON, keyed by session token) ─────────────────
interface Session {
  email: string;
  name: string;
  createdAt: number;
}

const SESSIONS_FILE = path.join(process.cwd(), ".sessions.json");

function loadSessions(): Map<string, Session> {
  const map = new Map<string, Session>();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
      for (const [k, v] of Object.entries(data)) {
        map.set(k, v as Session);
      }
    }
  } catch (e) { console.error("[Session] Failed to load sessions:", e); }
  return map;
}

function saveSessions(map: Map<string, Session>) {
  try {
    const obj = Object.fromEntries(map.entries());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (e) { console.error("[Session] Failed to save sessions:", e); }
}

const sessions = loadSessions();
const SESSION_COOKIE = "nru_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function createSession(email: string, name: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { email, name, createdAt: Date.now() });
  saveSessions(sessions);
  return token;
}

function getSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE) {
    sessions.delete(token);
    saveSessions(sessions);
    return null;
  }
  return session;
}

function deleteSession(token: string) {
  sessions.delete(token);
  saveSessions(sessions);
}

// Middleware: get current session from cookie
function getCurrentSession(req: express.Request): Session | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  return getSession(token);
}

// ── OAuth tokens per user ─────────────────────────────────────────────────────
const TOKEN_FILE = path.join(process.cwd(), ".tokens.json");

interface TokenStore {
  [email: string]: any; // Google OAuth token response keyed by user email
}

function loadAllTokens(): TokenStore {
  try {
    if (fs.existsSync(TOKEN_FILE)) return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  } catch (e) { console.error("[OAuth] Failed to load tokens:", e); }
  return {};
}

function saveAllTokens(store: TokenStore) {
  try { fs.writeFileSync(TOKEN_FILE, JSON.stringify(store, null, 2), "utf-8"); }
  catch (e) { console.error("[OAuth] Failed to save tokens:", e); }
}

function getUserToken(email: string): any {
  return loadAllTokens()[email.toLowerCase()] || null;
}

function setUserToken(email: string, token: any) {
  const store = loadAllTokens();
  store[email.toLowerCase()] = token;
  saveAllTokens(store);
}

function deleteUserToken(email: string) {
  const store = loadAllTokens();
  delete store[email.toLowerCase()];
  saveAllTokens(store);
}

// ── Recipes store ─────────────────────────────────────────────────────────────
const RECIPES_FILE = path.join(process.cwd(), ".recipes.json");


function loadRecipes(): any[] {
  try {
    if (fs.existsSync(RECIPES_FILE)) {
      const list = JSON.parse(fs.readFileSync(RECIPES_FILE, "utf-8"));
      // Filter out any static default recipes (they don't start with "custom-")
      const filtered = list.filter((r: any) => typeof r.id === "string" && r.id.startsWith("custom-"));
      if (filtered.length !== list.length) {
        fs.writeFileSync(RECIPES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
      }
      return filtered;
    }
  } catch (e) {
    console.error("[Recipes] Failed to load recipes:", e);
  }
  return [];
}

function saveRecipes(recipes: any[]) {
  try {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), "utf-8");
  } catch (e) {
    console.error("[Recipes] Failed to save recipes:", e);
  }
}

// ── Comments store ────────────────────────────────────────────────────────────
const COMMENTS_FILE = path.join(process.cwd(), ".comments.json");

function loadComments(): any[] {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("[Comments] Failed to load comments:", e);
  }
  return [];
}

function saveComments(comments: any[]) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
  } catch (e) {
    console.error("[Comments] Failed to save comments:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set("trust proxy", true);
  app.use(express.json({ limit: "20mb" }));
  app.use(cookieParser());

  // ── Auth endpoints ──────────────────────────────────────────────────────────

  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = findUser(email);
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const users = loadUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    users.push({ name: trimmedName, email: normalizedEmail, passwordHash });
    saveUsers(users);

    const sessionToken = createSession(normalizedEmail, trimmedName);
    res.cookie(SESSION_COOKIE, sessionToken, { httpOnly: true, maxAge: SESSION_MAX_AGE, sameSite: "lax" });

    console.log(`[Auth] New user signed up: ${normalizedEmail}`);
    res.json({ success: true, name: trimmedName, email: normalizedEmail });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = findUser(email);
    if (!user) return res.status(401).json({ error: "No account found with this email" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });

    const sessionToken = createSession(user.email, user.name);
    res.cookie(SESSION_COOKIE, sessionToken, { httpOnly: true, maxAge: SESSION_MAX_AGE, sameSite: "lax" });

    console.log(`[Auth] User logged in: ${user.email}`);
    res.json({ success: true, name: user.name, email: user.email });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) deleteSession(token);
    res.clearCookie(SESSION_COOKIE);
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    res.json({ name: session.name, email: session.email });
  });

  app.get("/api/auth/exists", (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email required" });
    res.json({ exists: !!findUser(email) });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ── Gemini AI endpoints ────────────────────────────────────────────────────

  // Models tried in order — fall through on failure
  const GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite",
  ];

  async function tryGeminiModels(fn: (model: string) => Promise<any>): Promise<any> {
    let lastError: any;
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[AI] Attempting Gemini call with model: ${model}`);
        return await fn(model);
      } catch (err: any) {
        console.warn(`[AI] Model ${model} failed, trying next... Error:`, err.message || err);
        lastError = err;
      }
    }
    throw lastError;
  }


  // Step 1: Identify food and ask clarifying questions
  app.post("/api/ai/clarify", async (req, res) => {
    const { base64Image, mimeType } = req.body;
    if (!base64Image || !mimeType) return res.status(400).json({ error: "base64Image and mimeType required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

      const response = await tryGeminiModels((model) => ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { mimeType, data: imageData } },
            { text: `You are a nutrition assistant. Look at this food image.
1. First check if this is actually food. If NOT food, return isFood: false.
2. If it IS food, identify the dish name and ask 2-3 short, specific clarifying questions that would help you give a more accurate nutritional analysis. Focus on cooking method (fried/grilled/steamed/raw), oil/fat used, portion size, added ingredients not visible, or sauce/dressing. Keep questions concise and numbered.

Return JSON only.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isFood: { type: Type.BOOLEAN },
              foodName: { type: Type.STRING },
              questions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["isFood", "foodName", "questions"]
          }
        }
      }));

      const text = response.text;
      if (!text) return res.status(500).json({ error: "No response from AI" });
      res.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err: any) {
      console.error("[AI] Clarify error:", err.message);
      // Parse Google's JSON error message if present
      let userMsg = "AI is temporarily overloaded. Please try again in a moment.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error?.status === "UNAVAILABLE") userMsg = "AI is temporarily overloaded. Please try again in a moment.";
        else if (parsed?.error?.status === "RESOURCE_EXHAUSTED") userMsg = "API quota exceeded. Please try again later.";
        else if (parsed?.error?.message) userMsg = parsed.error.message;
      } catch {}
      res.status(503).json({ error: userMsg });
    }
  });

  // Step 2: Full analysis with user's answers to clarifying questions
  app.post("/api/ai/analyze", async (req, res) => {
    const { base64Image, mimeType, userAnswers } = req.body;
    if (!base64Image || !mimeType) return res.status(400).json({ error: "base64Image and mimeType required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

      const contextNote = userAnswers
        ? `\n\nThe user has provided these additional details about the meal:\n${userAnswers}\n\nUse these details to give a more accurate nutritional breakdown.`
        : "";

      const response = await tryGeminiModels((model) => ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { mimeType, data: imageData } },
            { text: `Analyze this food image. Set 'isFood' to true if it is food, false otherwise. If food, provide a comprehensive nutrition breakdown including food name, estimated calories, protein (g), carbs (g), fat (g), fiber (g), sugar (g), vitamins/minerals, glycemic index (Low/Medium/High), estimated weight (grams), health score (0-100), a brief overall analysis, and 3 short actionable health tips.${contextNote}` }
          ]
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
              vitamins: { type: Type.ARRAY, items: { type: Type.STRING } },
              glycemicIndex: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              estimatedWeight: { type: Type.NUMBER },
              healthScore: { type: Type.NUMBER },
              analysis: { type: Type.STRING },
              healthTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["isFood", "foodName", "calories", "protein", "carbs", "fat", "healthScore", "analysis", "healthTips"],
          }
        }
      }));

      const text = response.text;
      if (!text) return res.status(500).json({ error: "No response from AI" });
      const clean = text.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(clean));
    } catch (err: any) {
      console.error("[AI] Analyze error:", err.message);
      let userMsg = "AI is temporarily overloaded. Please try again in a moment.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error?.status === "UNAVAILABLE") userMsg = "AI is temporarily overloaded. Please try again in a moment.";
        else if (parsed?.error?.status === "RESOURCE_EXHAUSTED") userMsg = "API quota exceeded. Please try again later.";
        else if (parsed?.error?.message) userMsg = parsed.error.message;
      } catch {}
      res.status(503).json({ error: userMsg });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
    const apiKey = process.env.GEMINI_API_KEY;

    try {
      // 1. Check if Ollama is running and get tags
      const tagsRes = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 1500 });
      const modelsList = tagsRes.data?.models || [];
      
      if (modelsList.length === 0) {
        throw new Error("No local models installed in Ollama.");
      }

      const model = modelsList[0].name;

      // 2. Prepare the chat message payload
      const messages = [
        {
          role: "system",
          content: "You are Nru, a friendly and expert AI nutrition assistant. You help users understand nutrition, track their goals, and make healthier food choices. Be concise, evidence-based, and encouraging."
        },
        ...(history || []).map((h: any) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.parts
        })),
        { role: "user", content: message }
      ];

      console.log(`[Ollama] Sending chat request to model '${model}' at ${OLLAMA_HOST}...`);

      // 3. Make chat request to Ollama
      const response = await axios.post(`${OLLAMA_HOST}/api/chat`, {
        model,
        messages,
        stream: false
      }, { timeout: 60000 });

      const responseText = response.data?.message?.content || "";
      return res.json({ text: responseText });
    } catch (ollamaErr: any) {
      console.warn(
        "[AI] Ollama not available, falling back to Gemini API:", 
        ollamaErr.message,
        ollamaErr.response?.data ? JSON.stringify(ollamaErr.response.data) : ""
      );

      if (!apiKey) {
        return res.status(503).json({ 
          error: "Ollama is not running locally, and GEMINI_API_KEY is not configured. Please download and install Ollama (https://ollama.com) and start it, or set the GEMINI_API_KEY." 
        });
      }

      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const response = await tryGeminiModels((model) => ai.models.generateContent({
          model,
          contents: [
            ...(history || []).map((h: any) => ({
              role: h.role === "user" ? "user" : "model",
              parts: [{ text: h.parts }]
            })),
            { role: "user", parts: [{ text: message }] }
          ],
          config: {
            systemInstruction: "You are Nru, a friendly and expert AI nutrition assistant. You help users understand nutrition, track their goals, and make healthier food choices. Be concise, evidence-based, and encouraging.",
          }
        }));

        return res.json({ text: response.text ?? "I couldn't generate a response. Please try again." });
      } catch (geminiErr: any) {
        console.error("[AI] Gemini fallback error:", geminiErr.message);
        return res.status(503).json({ 
          error: "Failed to connect to local Ollama server, and Gemini API fallback failed." 
        });
      }
    }
  });

  // ── Recipe endpoints ────────────────────────────────────────────────────────
  app.get("/api/recipes", (req, res) => {
    res.json(loadRecipes());
  });

  app.post("/api/recipes", (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const newRecipe = req.body;
    if (!newRecipe || !newRecipe.title) {
      return res.status(400).json({ error: "Recipe title is required" });
    }

    const recipes = loadRecipes();
    // Add author details if not already present
    const enrichedRecipe = {
      ...newRecipe,
      id: newRecipe.id || "custom-" + Date.now().toString(),
      author: newRecipe.author || session.name,
      authorInitials: newRecipe.authorInitials || session.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
      createdBy: session.email,
    };

    recipes.unshift(enrichedRecipe);
    saveRecipes(recipes);
    console.log(`[Recipes] New recipe uploaded by user ${session.email}: ${enrichedRecipe.title}`);
    res.json(enrichedRecipe);
  });

  app.delete("/api/recipes/:id", (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const { id } = req.params;
    const recipes = loadRecipes();
    const recipeIndex = recipes.findIndex(r => r.id.toString() === id.toString());

    if (recipeIndex === -1) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const deletedRecipe = recipes[recipeIndex];

    // Enforce that delete is only allowed for the user who uploaded it
    if (deletedRecipe.createdBy && deletedRecipe.createdBy.toLowerCase() !== session.email.toLowerCase()) {
      return res.status(403).json({ error: "You can only delete recipes that you uploaded" });
    }

    recipes.splice(recipeIndex, 1);
    saveRecipes(recipes);
    console.log(`[Recipes] Recipe deleted: ${deletedRecipe.title} by user ${session.email}`);
    res.json({ success: true });
  });

  // ── Comment endpoints ───────────────────────────────────────────────────────
  app.get("/api/comments", (req, res) => {
    res.json(loadComments());
  });

  app.post("/api/comments", (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const { recipeId, text } = req.body;
    if (!recipeId || !text) {
      return res.status(400).json({ error: "Recipe ID and text are required" });
    }

    const comments = loadComments();
    const newComment = {
      id: Math.random().toString(36).substring(7),
      recipeId: recipeId.toString(),
      text,
      date: new Date().toLocaleDateString(),
      author: session.name
    };

    comments.unshift(newComment);
    saveComments(comments);
    console.log(`[Comments] New comment added by ${session.email} on recipe ${recipeId}`);
    res.json(newComment);
  });

  // Google Auth URL — requires active session
  app.get("/api/auth/url", (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
    }

    // Extremely robust redirect URI detection
    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto");
    const host = forwardedHost || req.get("host");
    const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");
    
    // If we have an APP_URL env var, we should use that as the base
    let redirectUri = `${protocol}://${host}/auth/callback`;
    if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" && !host?.includes("localhost")) {
        redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback`;
    }
    
    console.log(`[OAuth] Final Redirect URI: ${redirectUri}`);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.nutrition.read profile email openid",
      redirect_uri: redirectUri,
      access_type: "offline",
      prompt: "consent",
      state: Buffer.from(session.email).toString("base64"), // carry user email through OAuth flow
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // OAuth Callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("No code provided");

    // Decode user email from state param
    let userEmail = "";
    try {
      userEmail = Buffer.from(state as string, "base64").toString("utf-8");
    } catch (e) {
      return res.status(400).send("Invalid state parameter");
    }

    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto");
    const host = forwardedHost || req.get("host");
    const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");
    
    let redirectUri = `${protocol}://${host}/auth/callback`;
    if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" && !host?.includes("localhost")) {
        redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback`;
    }

    console.log(`[OAuth] Callback for user: ${userEmail}, Redirect URI: ${redirectUri}`);

    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      // Store tokens keyed by user email — no more single global token
      setUserToken(userEmail, response.data);
      console.log(`[OAuth] Tokens stored for user: ${userEmail}`);

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <div style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;">✓</div>
                <h2 style="color: #1e293b; margin-bottom: 0.5rem;">Google Health Connected</h2>
                <p style="color: #64748b;">You can close this window now.</p>
                <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, window.location.origin);
                    setTimeout(() => window.close(), 1500);
                }
                </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("[OAuth] Token exchange failed:", errorData || error.message);
      res.status(500).send(`Authentication failed: ${JSON.stringify(errorData || error.message)}`);
    }
  });

  // Debug endpoint — shows raw Google Fit response
  app.get("/api/watch/debug", async (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    const userToken = getUserToken(session.email);
    if (!userToken) return res.status(401).json({ error: "Not connected to Google Fit" });
    try {
      const startOfDay = Date.now() - (24 * 60 * 60 * 1000);
      const endOfTime = Date.now();
      const response = await axios.post(
        "https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        {
          aggregateBy: [
            { dataTypeName: "com.google.step_count.delta" },
            { dataTypeName: "com.google.sleep.segment" },
            { dataTypeName: "com.google.hydration" }
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startOfDay,
          endTimeMillis: endOfTime,
        },
        { headers: { Authorization: `Bearer ${userToken.access_token}` } }
      );
      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message, details: err.response?.data });
    }
  });

  // Disconnect Google Fit for the current user
  app.post("/api/watch/disconnect", (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    deleteUserToken(session.email);
    console.log(`[OAuth] Disconnected Google Fit for user: ${session.email}`);
    res.json({ success: true });
  });

  app.get("/api/watch/sync", async (req, res) => {
    const session = getCurrentSession(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    let userToken = getUserToken(session.email);
    if (!userToken) return res.status(401).json({ error: "Not connected" });

    const fetchData = async (token: string) => {
        // Use a 24-hour rolling window to catch all of today's data regardless of timezone
        const startOfDay = Date.now() - (24 * 60 * 60 * 1000);
        const endOfTime = Date.now();
        
        return await axios.post(
          "https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate",
          {
            aggregateBy: [
              { dataTypeName: "com.google.step_count.delta" },
              { dataTypeName: "com.google.sleep.segment" },
              { dataTypeName: "com.google.hydration" }
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: startOfDay,
            endTimeMillis: endOfTime,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    try {
        let fitnessRes;
        try {
            fitnessRes = await fetchData(userToken.access_token);
        } catch (error: any) {
            // Try refreshing token if unauthorized
            if (error.response?.status === 401 && userToken.refresh_token) {
                console.log(`[OAuth] Token expired for ${session.email}, refreshing...`);
                const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    refresh_token: userToken.refresh_token,
                    grant_type: "refresh_token",
                });
                userToken = { ...userToken, ...refreshRes.data };
                setUserToken(session.email, userToken);
                fitnessRes = await fetchData(userToken.access_token);
            } else {
                throw error;
            }
        }

        const buckets = fitnessRes.data.bucket || [];
        
        // Log full raw response for debugging
        console.log("[Sync] Raw bucket count:", buckets.length);
        buckets.forEach((bucket: any, bi: number) => {
            console.log(`[Sync] Bucket[${bi}] startTime=${bucket.startTimeMillis} endTime=${bucket.endTimeMillis}`);
            (bucket.dataset || []).forEach((ds: any, di: number) => {
                console.log(`[Sync]   Dataset[${di}] sourceId=${ds.dataSourceId} points=${ds.point?.length || 0}`);
                if (ds.point?.length > 0) {
                    console.log(`[Sync]   First point:`, JSON.stringify(ds.point[0]));
                }
            });
        });

        let steps = 0;
        let sleepHours = 0;
        let hydrationMl = 0;

        buckets.forEach((bucket: any) => {
            const datasets = bucket?.dataset || [];
            datasets.forEach((ds: any) => {
                if (!ds.point || ds.point.length === 0) return;

                if (ds.dataSourceId.includes("step_count.delta")) {
                    steps += ds.point.reduce((acc: number, p: any) => {
                        return acc + (p.value?.[0]?.intVal || 0);
                    }, 0);

                } else if (ds.dataSourceId.includes("sleep.segment")) {
                    const durationMillis = ds.point.reduce((acc: number, p: any) => {
                        const start = Number(p.startTimeNanos) / 1e6;
                        const end = Number(p.endTimeNanos) / 1e6;
                        return acc + (end - start);
                    }, 0);
                    const hours = Math.round((durationMillis / (1000 * 60 * 60)) * 10) / 10;
                    if (hours > 0) sleepHours = hours;

                } else if (ds.dataSourceId.includes("hydration")) {
                    hydrationMl += ds.point.reduce((acc: number, p: any) => {
                        return acc + (p.value?.[0]?.fpVal || 0) * 1000;
                    }, 0);
                }
            });
        });

        console.log(`[Sync] Parsed → steps=${steps}, sleep=${sleepHours}h, hydration=${hydrationMl}ml`);

        res.json({
            steps,
            sleep: sleepHours,
            hydration: Math.round(hydrationMl),
            lastSync: new Date().toISOString()
        });
    } catch (error: any) {
        const errorData = error.response?.data;
        console.error("[OAuth] Sync error full response:", JSON.stringify(errorData, null, 2));
        
        // Extract message from various possible Google error formats
        const message = errorData?.error?.message || errorData?.message || error.message;
        const details = typeof message === 'string' ? message : JSON.stringify(message);
        
        const isApiDisabled = details?.toLowerCase().includes("fitness api has not been used") || 
                            details?.toLowerCase().includes("disabled") ||
                            errorData?.error?.status === "PERMISSION_DENIED";

        res.status(500).json({ 
            error: "Sync failed",
            details: details,
            isApiDisabled: isApiDisabled
        });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
