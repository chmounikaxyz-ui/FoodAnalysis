import fs from "fs";
import path from "path";

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  photo?: string;
}

export interface Session {
  token: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface Recipe {
  id: string;
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
  createdBy?: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  text: string;
  date: string;
  author: string;
}

export interface MealLog {
  id: string;
  timestamp: number;
  info: any;
  imageUrl?: string;
}

export interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration?: number;
  sleep?: number;
  steps?: number;
}

export interface UserMetrics {
  hydration: number;
  sleep: number;
  steps: number;
}

export interface Database {
  initialize(): Promise<void>;
  
  // Users
  loadUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  findUser(email: string): Promise<User | undefined>;
  createUser(user: User): Promise<void>;
  updateUserPhoto(email: string, photo: string): Promise<void>;

  // Sessions
  loadSessions(): Promise<Map<string, Session>>;
  saveSession(token: string, session: Session): Promise<void>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;

  // OAuth Tokens
  loadAllTokens(): Promise<Record<string, any>>;
  getUserToken(email: string): Promise<any>;
  setUserToken(email: string, token: any): Promise<void>;
  deleteUserToken(email: string): Promise<void>;

  // Recipes
  loadRecipes(): Promise<Recipe[]>;
  saveRecipe(recipe: Recipe): Promise<void>;
  deleteRecipe(id: string, userEmail: string): Promise<boolean>;

  // Comments
  loadComments(): Promise<Comment[]>;
  saveComment(comment: Comment): Promise<void>;

  // User-specific synced data (Meals, Goals, Metrics)
  getUserMeals(email: string): Promise<MealLog[]>;
  saveUserMeal(email: string, meal: MealLog): Promise<void>;
  deleteUserMeal(email: string, mealId: string): Promise<boolean>;
  
  getUserGoals(email: string): Promise<DailyGoal>;
  saveUserGoals(email: string, goals: DailyGoal): Promise<void>;
  
  getUserMetrics(email: string): Promise<UserMetrics>;
  saveUserMetrics(email: string, metrics: Partial<UserMetrics>): Promise<void>;
}

// ============================================================================
// 1. FILE SYSTEM DATABASE IMPLEMENTATION (Zero-config fallback)
// ============================================================================
export class FileDatabase implements Database {
  private baseDir: string;
  private usersFile: string;
  private sessionsFile: string;
  private tokensFile: string;
  private recipesFile: string;
  private commentsFile: string;
  private userDataDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), ".data");
    this.usersFile = path.join(this.baseDir, "users.json");
    this.sessionsFile = path.join(this.baseDir, "sessions.json");
    this.tokensFile = path.join(this.baseDir, "tokens.json");
    this.recipesFile = path.join(this.baseDir, "recipes.json");
    this.commentsFile = path.join(this.baseDir, "comments.json");
    this.userDataDir = path.join(this.baseDir, "users_data");
  }

  async initialize(): Promise<void> {
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
    if (!fs.existsSync(this.userDataDir)) fs.mkdirSync(this.userDataDir, { recursive: true });
    console.log(`[Database] File Database initialized at ${this.baseDir}`);
  }

  private readJsonFile<T>(filePath: string, defaultVal: T): T {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      console.error(`[Database] Failed to read ${filePath}:`, e);
    }
    return defaultVal;
  }

  private writeJsonFile(filePath: string, data: any): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error(`[Database] Failed to write ${filePath}:`, e);
    }
  }

  // Users
  async loadUsers(): Promise<User[]> {
    return this.readJsonFile<User[]>(this.usersFile, []);
  }

  async saveUsers(users: User[]): Promise<void> {
    this.writeJsonFile(this.usersFile, users);
  }

  async findUser(email: string): Promise<User | undefined> {
    const target = email.trim().toLowerCase();
    const users = await this.loadUsers();
    return users.find(u => u.email.trim().toLowerCase() === target);
  }

  async createUser(user: User): Promise<void> {
    const users = await this.loadUsers();
    users.push(user);
    await this.saveUsers(users);
  }

  async updateUserPhoto(email: string, photo: string): Promise<void> {
    const users = await this.loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.photo = photo;
      await this.saveUsers(users);
    }
  }

  // Sessions
  async loadSessions(): Promise<Map<string, Session>> {
    const data = this.readJsonFile<Record<string, Session>>(this.sessionsFile, {});
    const map = new Map<string, Session>();
    for (const [k, v] of Object.entries(data)) {
      map.set(k, v);
    }
    return map;
  }

  async saveSession(token: string, session: Session): Promise<void> {
    const data = this.readJsonFile<Record<string, Session>>(this.sessionsFile, {});
    data[token] = session;
    this.writeJsonFile(this.sessionsFile, data);
  }

  async getSession(token: string): Promise<Session | undefined> {
    const data = this.readJsonFile<Record<string, Session>>(this.sessionsFile, {});
    return data[token];
  }

  async deleteSession(token: string): Promise<void> {
    const data = this.readJsonFile<Record<string, Session>>(this.sessionsFile, {});
    delete data[token];
    this.writeJsonFile(this.sessionsFile, data);
  }

  // Tokens
  async loadAllTokens(): Promise<Record<string, any>> {
    return this.readJsonFile<Record<string, any>>(this.tokensFile, {});
  }

  async getUserToken(email: string): Promise<any> {
    const tokens = await this.loadAllTokens();
    return tokens[email.toLowerCase()] || null;
  }

  async setUserToken(email: string, token: any): Promise<void> {
    const tokens = await this.loadAllTokens();
    tokens[email.toLowerCase()] = token;
    this.writeJsonFile(this.tokensFile, tokens);
  }

  async deleteUserToken(email: string): Promise<void> {
    const tokens = await this.loadAllTokens();
    delete tokens[email.toLowerCase()];
    this.writeJsonFile(this.tokensFile, tokens);
  }

  // Recipes
  async loadRecipes(): Promise<Recipe[]> {
    return this.readJsonFile<Recipe[]>(this.recipesFile, []);
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    const recipes = await this.loadRecipes();
    recipes.unshift(recipe);
    this.writeJsonFile(this.recipesFile, recipes);
  }

  async deleteRecipe(id: string, userEmail: string): Promise<boolean> {
    const recipes = await this.loadRecipes();
    const idx = recipes.findIndex(r => r.id.toString() === id.toString());
    if (idx === -1) return false;
    
    const recipe = recipes[idx];
    if (recipe.createdBy && recipe.createdBy.toLowerCase() !== userEmail.toLowerCase()) {
      return false;
    }
    
    recipes.splice(idx, 1);
    this.writeJsonFile(this.recipesFile, recipes);
    return true;
  }

  // Comments
  async loadComments(): Promise<Comment[]> {
    return this.readJsonFile<Comment[]>(this.commentsFile, []);
  }

  async saveComment(comment: Comment): Promise<void> {
    const comments = await this.loadComments();
    comments.unshift(comment);
    this.writeJsonFile(this.commentsFile, comments);
  }

  // User Synced Data
  private getUserDataFile(email: string): string {
    const safeName = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return path.join(this.userDataDir, `user_${safeName}.json`);
  }

  private getUserData(email: string): { meals: MealLog[]; goals: DailyGoal; metrics: UserMetrics } {
    const file = this.getUserDataFile(email);
    return this.readJsonFile(file, {
      meals: [],
      goals: { calories: 2000, protein: 120, carbs: 220, fat: 65, hydration: 2500, sleep: 8, steps: 10000 },
      metrics: { hydration: 0, sleep: 0, steps: 0 }
    });
  }

  private saveUserData(email: string, data: any): void {
    const file = this.getUserDataFile(email);
    this.writeJsonFile(file, data);
  }

  async getUserMeals(email: string): Promise<MealLog[]> {
    return this.getUserData(email).meals;
  }

  async saveUserMeal(email: string, meal: MealLog): Promise<void> {
    const data = this.getUserData(email);
    // Overwrite existing meal or push new
    const idx = data.meals.findIndex(m => m.id === meal.id);
    if (idx !== -1) {
      data.meals[idx] = meal;
    } else {
      data.meals.unshift(meal);
    }
    this.saveUserData(email, data);
  }

  async deleteUserMeal(email: string, mealId: string): Promise<boolean> {
    const data = this.getUserData(email);
    const idx = data.meals.findIndex(m => m.id === mealId);
    if (idx === -1) return false;
    data.meals.splice(idx, 1);
    this.saveUserData(email, data);
    return true;
  }

  async getUserGoals(email: string): Promise<DailyGoal> {
    return this.getUserData(email).goals;
  }

  async saveUserGoals(email: string, goals: DailyGoal): Promise<void> {
    const data = this.getUserData(email);
    data.goals = { ...data.goals, ...goals };
    this.saveUserData(email, data);
  }

  async getUserMetrics(email: string): Promise<UserMetrics> {
    return this.getUserData(email).metrics;
  }

  async saveUserMetrics(email: string, metrics: Partial<UserMetrics>): Promise<void> {
    const data = this.getUserData(email);
    data.metrics = { ...data.metrics, ...metrics };
    this.saveUserData(email, data);
  }
}

// ============================================================================
// 2. POSTGRESQL DATABASE IMPLEMENTATION
// ============================================================================
export class PostgresDatabase implements Database {
  private pool: any;

  constructor(connectionString: string) {
    // Dynamic import to avoid crash if pg driver is not installed locally
    try {
      const { Pool } = require("pg");
      this.pool = new Pool({
        connectionString,
        ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
          ? false
          : { rejectUnauthorized: false } // Required for hosting providers like Render/Supabase
      });
    } catch (e) {
      throw new Error("The 'pg' package is not installed. Run 'npm install pg' to use PostgreSQL.");
    }
  }

  async initialize(): Promise<void> {
    console.log("[Database] Connecting to PostgreSQL database...");
    
    // Create necessary tables if they don't exist
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        photo TEXT
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
        token_data TEXT NOT NULL
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        author_initials VARCHAR(10),
        image TEXT NOT NULL,
        description TEXT,
        health_score INTEGER NOT NULL,
        calories INTEGER NOT NULL,
        prep_time VARCHAR(50),
        likes INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        tags TEXT, -- JSON array
        servings INTEGER NOT NULL,
        nutrition TEXT NOT NULL, -- JSON object
        ingredients TEXT NOT NULL, -- JSON array
        steps TEXT NOT NULL, -- JSON array
        is_custom BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(255) PRIMARY KEY,
        recipe_id VARCHAR(255) REFERENCES recipes(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        date VARCHAR(50) NOT NULL,
        author VARCHAR(255) NOT NULL
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        timestamp BIGINT NOT NULL,
        info TEXT NOT NULL, -- JSON object
        image_url TEXT
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS goals (
        email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
        calories INTEGER DEFAULT 2000,
        protein INTEGER DEFAULT 120,
        carbs INTEGER DEFAULT 220,
        fat INTEGER DEFAULT 65,
        hydration INTEGER DEFAULT 2500,
        sleep INTEGER DEFAULT 8,
        steps INTEGER DEFAULT 10000
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
        hydration INTEGER DEFAULT 0,
        sleep REAL DEFAULT 0.0,
        steps INTEGER DEFAULT 0
      );
    `);

    console.log("[Database] PostgreSQL tables initialized and ready.");
  }

  private async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  // Users
  async loadUsers(): Promise<User[]> {
    const res = await this.query("SELECT name, email, password_hash as \"passwordHash\", photo FROM users");
    return res.rows;
  }

  async saveUsers(users: User[]): Promise<void> {
    // No-op for Postgres because users are created individually
  }

  async findUser(email: string): Promise<User | undefined> {
    const res = await this.query("SELECT name, email, password_hash as \"passwordHash\", photo FROM users WHERE LOWER(email) = $1", [email.toLowerCase().trim()]);
    return res.rows[0];
  }

  async createUser(user: User): Promise<void> {
    await this.query(
      "INSERT INTO users (email, name, password_hash, photo) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
      [user.email.toLowerCase().trim(), user.name.trim(), user.passwordHash, user.photo || null]
    );
    // Create initial empty goals and metrics for the user
    await this.query("INSERT INTO goals (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [user.email.toLowerCase().trim()]);
    await this.query("INSERT INTO metrics (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [user.email.toLowerCase().trim()]);
  }

  async updateUserPhoto(email: string, photo: string): Promise<void> {
    await this.query("UPDATE users SET photo = $1 WHERE LOWER(email) = $2", [photo, email.toLowerCase()]);
  }

  // Sessions
  async loadSessions(): Promise<Map<string, Session>> {
    const res = await this.query("SELECT token, email, name, created_at as \"createdAt\" FROM sessions");
    const map = new Map<string, Session>();
    for (const row of res.rows) {
      map.set(row.token, { ...row, createdAt: Number(row.createdAt) });
    }
    return map;
  }

  async saveSession(token: string, session: Session): Promise<void> {
    await this.query(
      "INSERT INTO sessions (token, email, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (token) DO UPDATE SET email = $2, name = $3, created_at = $4",
      [token, session.email.toLowerCase(), session.name, session.createdAt]
    );
  }

  async getSession(token: string): Promise<Session | undefined> {
    const res = await this.query("SELECT token, email, name, created_at as \"createdAt\" FROM sessions WHERE token = $1", [token]);
    if (!res.rows[0]) return undefined;
    return { ...res.rows[0], createdAt: Number(res.rows[0].createdAt) };
  }

  async deleteSession(token: string): Promise<void> {
    await this.query("DELETE FROM sessions WHERE token = $1", [token]);
  }

  // Tokens
  async loadAllTokens(): Promise<Record<string, any>> {
    const res = await this.query("SELECT email, token_data FROM tokens");
    const record: Record<string, any> = {};
    for (const row of res.rows) {
      record[row.email] = JSON.parse(row.token_data);
    }
    return record;
  }

  async getUserToken(email: string): Promise<any> {
    const res = await this.query("SELECT token_data FROM tokens WHERE LOWER(email) = $1", [email.toLowerCase()]);
    if (!res.rows[0]) return null;
    return JSON.parse(res.rows[0].token_data);
  }

  async setUserToken(email: string, token: any): Promise<void> {
    await this.query(
      "INSERT INTO tokens (email, token_data) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET token_data = $2",
      [email.toLowerCase(), JSON.stringify(token)]
    );
  }

  async deleteUserToken(email: string): Promise<void> {
    await this.query("DELETE FROM tokens WHERE LOWER(email) = $1", [email.toLowerCase()]);
  }

  // Recipes
  async loadRecipes(): Promise<Recipe[]> {
    const res = await this.query("SELECT id, title, author, author_initials as \"authorInitials\", image, description, health_score as \"healthScore\", calories, prep_time as \"prepTime\", likes, comments_count as \"comments\", tags, servings, nutrition, ingredients, steps, is_custom as \"isCustom\", created_by as \"createdBy\" FROM recipes ORDER BY id DESC");
    return res.rows.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
      nutrition: r.nutrition ? JSON.parse(r.nutrition) : { protein: 0, carbs: 0, fat: 0, fiber: 0 },
      ingredients: r.ingredients ? JSON.parse(r.ingredients) : [],
      steps: r.steps ? JSON.parse(r.steps) : []
    }));
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    await this.query(`
      INSERT INTO recipes (
        id, title, author, author_initials, image, description, health_score, 
        calories, prep_time, likes, comments_count, tags, servings, nutrition, 
        ingredients, steps, is_custom, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      recipe.id, recipe.title, recipe.author, recipe.authorInitials || null, recipe.image, recipe.description || null,
      recipe.healthScore, recipe.calories, recipe.prepTime, recipe.likes || 0, recipe.comments || 0,
      JSON.stringify(recipe.tags || []), recipe.servings, JSON.stringify(recipe.nutrition),
      JSON.stringify(recipe.ingredients || []), JSON.stringify(recipe.steps || []),
      recipe.isCustom ?? true, recipe.createdBy || null
    ]);
  }

  async deleteRecipe(id: string, userEmail: string): Promise<boolean> {
    // Check ownership first
    const res = await this.query("SELECT created_by FROM recipes WHERE id = $1", [id]);
    if (!res.rows[0]) return false;
    
    const owner = res.rows[0].created_by;
    if (owner && owner.toLowerCase() !== userEmail.toLowerCase()) return false;
    
    await this.query("DELETE FROM recipes WHERE id = $1", [id]);
    return true;
  }

  // Comments
  async loadComments(): Promise<Comment[]> {
    const res = await this.query("SELECT id, recipe_id as \"recipeId\", text, date, author FROM comments ORDER BY id DESC");
    return res.rows;
  }

  async saveComment(comment: Comment): Promise<void> {
    await this.query(
      "INSERT INTO comments (id, recipe_id, text, date, author) VALUES ($1, $2, $3, $4, $5)",
      [comment.id, comment.recipeId, comment.text, comment.date, comment.author]
    );
    // Update comments count on recipes
    await this.query("UPDATE recipes SET comments_count = comments_count + 1 WHERE id = $1", [comment.recipeId]);
  }

  // User Synced Data
  async getUserMeals(email: string): Promise<MealLog[]> {
    const res = await this.query("SELECT id, timestamp, info, image_url as \"imageUrl\" FROM meals WHERE LOWER(email) = $1 ORDER BY timestamp DESC", [email.toLowerCase()]);
    return res.rows.map(row => ({
      id: row.id,
      timestamp: Number(row.timestamp),
      imageUrl: row.imageUrl || undefined,
      info: JSON.parse(row.info)
    }));
  }

  async saveUserMeal(email: string, meal: MealLog): Promise<void> {
    await this.query(`
      INSERT INTO meals (id, email, timestamp, info, image_url) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (id) DO UPDATE SET timestamp = $3, info = $4, image_url = $5
    `, [meal.id, email.toLowerCase(), meal.timestamp, JSON.stringify(meal.info), meal.imageUrl || null]);
  }

  async deleteUserMeal(email: string, mealId: string): Promise<boolean> {
    const res = await this.query("DELETE FROM meals WHERE id = $1 AND LOWER(email) = $2", [mealId, email.toLowerCase()]);
    return res.rowCount > 0;
  }

  async getUserGoals(email: string): Promise<DailyGoal> {
    const res = await this.query("SELECT calories, protein, carbs, fat, hydration, sleep, steps FROM goals WHERE LOWER(email) = $1", [email.toLowerCase()]);
    if (!res.rows[0]) {
      return { calories: 2000, protein: 120, carbs: 220, fat: 65, hydration: 2500, sleep: 8, steps: 10000 };
    }
    return res.rows[0];
  }

  async saveUserGoals(email: string, goals: DailyGoal): Promise<void> {
    await this.query(`
      INSERT INTO goals (email, calories, protein, carbs, fat, hydration, sleep, steps)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET 
        calories = COALESCE($2, goals.calories),
        protein = COALESCE($3, goals.protein),
        carbs = COALESCE($4, goals.carbs),
        fat = COALESCE($5, goals.fat),
        hydration = COALESCE($6, goals.hydration),
        sleep = COALESCE($7, goals.sleep),
        steps = COALESCE($8, goals.steps)
    `, [
      email.toLowerCase(), goals.calories, goals.protein, goals.carbs, goals.fat,
      goals.hydration || null, goals.sleep || null, goals.steps || null
    ]);
  }

  async getUserMetrics(email: string): Promise<UserMetrics> {
    const res = await this.query("SELECT hydration, sleep, steps FROM metrics WHERE LOWER(email) = $1", [email.toLowerCase()]);
    if (!res.rows[0]) {
      return { hydration: 0, sleep: 0, steps: 0 };
    }
    return {
      hydration: res.rows[0].hydration || 0,
      sleep: res.rows[0].sleep || 0,
      steps: res.rows[0].steps || 0
    };
  }

  async saveUserMetrics(email: string, metrics: Partial<UserMetrics>): Promise<void> {
    await this.query(`
      INSERT INTO metrics (email, hydration, sleep, steps)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET 
        hydration = COALESCE($2, metrics.hydration),
        sleep = COALESCE($3, metrics.sleep),
        steps = COALESCE($4, metrics.steps)
    `, [
      email.toLowerCase(),
      metrics.hydration !== undefined ? metrics.hydration : null,
      metrics.sleep !== undefined ? metrics.sleep : null,
      metrics.steps !== undefined ? metrics.steps : null
    ]);
  }
}
