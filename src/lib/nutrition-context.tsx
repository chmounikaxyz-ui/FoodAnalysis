import * as React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { MealLog, NutritionalInfo, Recipe } from "../types"

interface Comment {
  id: string;
  text: string;
  date: string;
  recipeId: string;
  author?: string;
}

interface Notification {
  id: string;
  title: string;
  desc: string;
  timestamp: number;
  type: "success" | "info" | "reminder";
}

interface NutritionContextType {
  meals: MealLog[]
  savedRecipes: Recipe[]
  userRecipes: Recipe[]
  comments: Comment[]
  hydration: number
  sleep: number
  steps: number
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  clearNotifications: () => void
  addMeal: (info: NutritionalInfo, imageUrl?: string) => void
  removeMeal: (id: string) => void
  toggleSaveRecipe: (recipe: any) => void
  addUserRecipe: (recipe: Recipe) => void
  removeUserRecipe: (id: string | number) => void
  addComment: (recipeId: string, text: string) => void
  addHydration: (amount: number) => void
  addSleep: (amount: number) => void
  addSteps: (amount: number) => void
  syncWithWatch: () => Promise<void>
  isWatchConnected: boolean
  setIsWatchConnected: (v: boolean) => void
  lastSync: string | null
  profile: {
    name: string;
    email: string;
    photo?: string;
  }
  dailyGoal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    hydration: number;
    sleep: number;
    steps: number;
  };
  totalCalories: number
  protein: number
  carbs: number
  fat: number
  updateDailyGoal: (goals: Partial<NutritionContextType["dailyGoal"]>) => void
  updateProfile: (profile: Partial<NutritionContextType["profile"]>) => void
  isAuthenticated: boolean
  notificationsRead: boolean
  markNotificationsRead: () => void
  login: (userData?: { name: string; email: string }) => void
  logout: () => void
  theme: "light" | "dark"
  toggleTheme: () => void
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined)

const DEFAULT_GOALS = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
  hydration: 2500,
  sleep: 8,
  steps: 10000,
}

const DEFAULT_MEALS: MealLog[] = [
  {
    id: "1",
    timestamp: Date.now() - 3600000 * 4,
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop",
    info: {
      isFood: true,
      foodName: "Grilled Salmon Bowl",
      calories: 520,
      protein: 42,
      carbs: 45,
      fat: 18,
      healthScore: 92,
      analysis: "Excellent source of omega-3 fatty acids and high-quality protein."
    }
  },
  {
    id: "2",
    timestamp: Date.now() - 3600000 * 8,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop",
    info: {
      isFood: true,
      foodName: "Greek Yogurt Parfait",
      calories: 310,
      protein: 18,
      carbs: 38,
      fat: 8,
      healthScore: 88,
      analysis: "Good probiotic content and balanced energy release."
    }
  }
]

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { 
    id: "1", 
    title: "Welcome to NutriSnap! 🥗", 
    desc: "Snap photos of your meals to get instant nutritional data.", 
    timestamp: Date.now(), 
    type: "info" 
  },
]

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem("nru_meals")
    return saved ? JSON.parse(saved) : DEFAULT_MEALS
  })

  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem("nru_saved_recipes")
    return saved ? JSON.parse(saved) : []
  })

  const [userRecipes, setUserRecipes] = useState<Recipe[]>([])

  const [comments, setComments] = useState<Comment[]>([])

  const [hydration, setHydration] = useState(() => {
    const saved = localStorage.getItem("nru_hydration")
    const today = new Date().toDateString()
    const data = saved ? JSON.parse(saved) : { amount: 0, date: today }
    return data.date === today ? data.amount : 0
  })

  const [sleep, setSleep] = useState(() => {
    const saved = localStorage.getItem("nru_sleep")
    const today = new Date().toDateString()
    const data = saved ? JSON.parse(saved) : { amount: 0, date: today }
    return data.date === today ? data.amount : 0
  })

  const [steps, setSteps] = useState(() => {
    const saved = localStorage.getItem("nru_steps")
    const today = new Date().toDateString()
    const data = saved ? JSON.parse(saved) : { amount: 0, date: today }
    return data.date === today ? data.amount : 0
  })

  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem("nru_goals")
    return saved ? JSON.parse(saved) : DEFAULT_GOALS
  })

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("nru_profile")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error("Error parsing profile", e)
      }
    }
    return { name: "User", email: "" }
  })

  const [isWatchConnected, setIsWatchConnected] = useState(() => {
    return localStorage.getItem("nru_watch_connected") === "true"
  })

  const [lastSync, setLastSync] = useState(() => {
    return localStorage.getItem("nru_last_sync")
  })

  const [notificationsRead, setNotificationsRead] = useState(() => {
    return localStorage.getItem("nru_notifications_read") === "true"
  })

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("nru_notifications")
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS
  })

  useEffect(() => {
    localStorage.setItem("nru_notifications", JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem("nru_meals", JSON.stringify(meals))
  }, [meals])

  useEffect(() => {
    localStorage.setItem("nru_saved_recipes", JSON.stringify(savedRecipes))
  }, [savedRecipes])



  useEffect(() => {
    localStorage.setItem("nru_hydration", JSON.stringify({
      amount: hydration,
      date: new Date().toDateString()
    }))
  }, [hydration])

  useEffect(() => {
    localStorage.setItem("nru_sleep", JSON.stringify({
      amount: sleep,
      date: new Date().toDateString()
    }))
  }, [sleep])

  useEffect(() => {
    localStorage.setItem("nru_steps", JSON.stringify({
      amount: steps,
      date: new Date().toDateString()
    }))
  }, [steps])

  useEffect(() => {
    localStorage.setItem("nru_goals", JSON.stringify(dailyGoal))
  }, [dailyGoal])

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("nru_auth") === "true"
  })

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("nru_theme") as "light" | "dark") || "light"
  })

  useEffect(() => {
    localStorage.setItem("nru_theme", theme)
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem("nru_profile", JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem("nru_watch_connected", isWatchConnected.toString())
  }, [isWatchConnected])

  useEffect(() => {
    if (lastSync) localStorage.setItem("nru_last_sync", lastSync)
  }, [lastSync])

  useEffect(() => {
    localStorage.setItem("nru_notifications_read", notificationsRead.toString())
  }, [notificationsRead])

  useEffect(() => {
    // Verify server-side session is still valid on mount
    if (localStorage.getItem("nru_auth") === "true") {
      fetch("/api/auth/me")
        .then(res => { if (!res.ok) { localStorage.removeItem("nru_auth"); setIsAuthenticated(false); } })
        .catch(() => {});
    }

    // Fetch recipes and comments from server
    fetch("/api/recipes")
      .then(res => { if (res.ok) return res.json(); })
      .then(data => { if (data) setUserRecipes(data); })
      .catch(() => {});

    fetch("/api/comments")
      .then(res => { if (res.ok) return res.json(); })
      .then(data => { if (data) setComments(data); })
      .catch(() => {});

    if (isWatchConnected) {
      syncWithWatch().catch(() => {}); // Silently verify on mount
    } else {
      // Even without a watch, estimate sleep from meal times
      const estimated = estimateSleepFromMeals(meals)
      if (estimated > 0 && sleep === 0) setSleep(estimated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const freqs = [880, 1100]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.13
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.start(t)
        osc.stop(t + 0.35)
      })
    } catch (e) {
      // Audio not available
    }
  }

  const addNotification = (n: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...n,
      id: Date.now().toString(),
      timestamp: Date.now()
    }
    setNotifications(prev => [newNotification, ...prev])
    setNotificationsRead(false)
    playNotificationSound()
  }

  const clearNotifications = () => {
    setNotifications([])
    setNotificationsRead(true)
  }

  const createGoalAchievement = (metric: string, amount: number, target: number) => {
    if (target <= 0) return
    addNotification({
      title: `${metric} Goal Achieved! 🏅`,
      desc: `You've reached your daily ${metric.toLowerCase()} target with ${amount}${metric === "Calories" ? " kcal" : ""}. Great progress!`,
      type: "success"
    })
  }

  const createThresholdWarning = (metric: string, amount: number, target: number) => {
    if (target <= 0) return
    addNotification({
      title: `${metric} Warning ⚠️`,
      desc: `Your ${metric.toLowerCase()} intake is now above the daily target. Try lighter choices for the rest of today.`,
      type: "reminder"
    })
  }

  const addMeal = (info: NutritionalInfo, imageUrl?: string) => {
    const newMeal: MealLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      info,
      imageUrl,
    }
    
    // Calculate today's totals BEFORE adding new meal to compare
    const todayStr = new Date().toDateString()
    const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === todayStr)
    const prevTotals = todayMeals.reduce((acc, m) => ({
      calories: acc.calories + m.info.calories,
      protein: acc.protein + m.info.protein,
      carbs: acc.carbs + m.info.carbs,
      fat: acc.fat + m.info.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    const newTotals = {
      calories: prevTotals.calories + info.calories,
      protein: prevTotals.protein + info.protein,
      carbs: prevTotals.carbs + info.carbs,
      fat: prevTotals.fat + info.fat,
    }

    setMeals((prev) => {
      const updated = [newMeal, ...prev]
      // Re-estimate sleep whenever a meal is added (breakfast triggers recalculation)
      const estimated = estimateSleepFromMeals(updated)
      if (estimated > 0) setSleep(estimated)
      return updated
    })

    // 1. Calorie goal reached and warning
    if (dailyGoal.calories > 0 && prevTotals.calories < dailyGoal.calories && newTotals.calories >= dailyGoal.calories) {
      createGoalAchievement("Calories", newTotals.calories, dailyGoal.calories)
    }
    if (dailyGoal.calories > 0 && prevTotals.calories <= dailyGoal.calories && newTotals.calories > dailyGoal.calories) {
      createThresholdWarning("Calories", newTotals.calories, dailyGoal.calories)
    }

    // 2. Carb goal warning
    if (dailyGoal.carbs > 0 && prevTotals.carbs <= dailyGoal.carbs && newTotals.carbs > dailyGoal.carbs) {
      createThresholdWarning("Carbs", newTotals.carbs, dailyGoal.carbs)
    }

    // 3. Fat goal warning
    if (dailyGoal.fat > 0 && prevTotals.fat <= dailyGoal.fat && newTotals.fat > dailyGoal.fat) {
      createThresholdWarning("Fats", newTotals.fat, dailyGoal.fat)
    }

    // 4. Protein target reached
    if (dailyGoal.protein > 0 && prevTotals.protein < dailyGoal.protein && newTotals.protein >= dailyGoal.protein) {
      createGoalAchievement("Protein", newTotals.protein, dailyGoal.protein)
    }
  }

  const removeMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }

  const toggleSaveRecipe = (recipe: any) => {
    setSavedRecipes((prev) => {
      const exists = prev.find((r) => r.id === recipe.id)
      if (exists) {
        return prev.filter((r) => r.id !== recipe.id)
      }
      return [...prev, recipe]
    })
  }

  const addUserRecipe = async (recipe: Recipe) => {
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });
      if (response.ok) {
        const savedRecipe = await response.json();
        setUserRecipes((prev) => [savedRecipe, ...prev]);
      }
    } catch (e) {
      console.error("[Recipes] Failed to add recipe:", e);
    }
  }

  const removeUserRecipe = async (id: string | number) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUserRecipes((prev) => prev.filter((r) => r.id.toString() !== id.toString()));
        setSavedRecipes((prev) => prev.filter((r) => r.id.toString() !== id.toString()));
      }
    } catch (e) {
      console.error("[Recipes] Failed to remove recipe:", e);
    }
  }

  const addComment = async (recipeId: string, text: string) => {
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, text }),
      });
      if (response.ok) {
        const savedComment = await response.json();
        setComments(prev => [savedComment, ...prev]);
      }
    } catch (e) {
      console.error("[Comments] Failed to add comment:", e);
    }
  }

  const addHydration = (amount: number) => {
    const prev = hydration
    const next = hydration + amount
    setHydration(next)

    if (dailyGoal.hydration > 0 && prev < dailyGoal.hydration && next >= dailyGoal.hydration) {
      createGoalAchievement("Hydration", next, dailyGoal.hydration)
    }
  }

  const addSleep = (amount: number) => {
    const prev = sleep
    const next = Math.min(sleep + amount, 24)
    setSleep(next)

    if (dailyGoal.sleep > 0 && prev < dailyGoal.sleep && next >= dailyGoal.sleep) {
      createGoalAchievement("Sleep", next, dailyGoal.sleep)
    }
  }

  const addSteps = (amount: number) => {
    const prev = steps
    const next = steps + amount
    setSteps(next)

    if (dailyGoal.steps > 0 && prev < dailyGoal.steps && next >= dailyGoal.steps) {
      createGoalAchievement("Activity", next, dailyGoal.steps)
    }
  }

  const estimateSleepFromMeals = (mealList: MealLog[]): number => {
    const now = new Date()
    const todayStr = now.toDateString()

    // Yesterday's date string
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    // Last dinner = last meal logged between 6 PM – 11:59 PM yesterday (or today if no breakfast yet)
    const dinnerWindow = mealList
      .filter(m => {
        const d = new Date(m.timestamp)
        const h = d.getHours()
        return d.toDateString() === yesterdayStr && h >= 18 && h <= 23
      })
      .sort((a, b) => b.timestamp - a.timestamp) // latest first

    // First breakfast = first meal logged between 5 AM – 10 AM today
    const breakfastWindow = mealList
      .filter(m => {
        const d = new Date(m.timestamp)
        const h = d.getHours()
        return d.toDateString() === todayStr && h >= 5 && h <= 10
      })
      .sort((a, b) => a.timestamp - b.timestamp) // earliest first

    if (dinnerWindow.length === 0 || breakfastWindow.length === 0) return 0

    const dinner = dinnerWindow[0]
    const breakfast = breakfastWindow[0]

    const diffMs = breakfast.timestamp - dinner.timestamp
    if (diffMs <= 0) return 0

    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10
    // Sanity check: sleep should be between 3 and 14 hours
    if (hours < 3 || hours > 14) return 0

    return hours
  }

  const syncWithWatch = async () => {
    try {
      const response = await fetch("/api/watch/sync")
      const data = await response.json()
      
      if (!response.ok) {
        const error = new Error(data.error || "Sync failed") as any
        error.details = data.details
        error.isApiDisabled = data.isApiDisabled
        throw error
      }
      
      setSteps(data.steps)
      setHydration(data.hydration)

      // Use Google Fit sleep if available, otherwise estimate from meal times
      if (data.sleep > 0) {
        setSleep(data.sleep)
      } else {
        const estimated = estimateSleepFromMeals(meals)
        if (estimated > 0) setSleep(estimated)
      }

      setLastSync(new Date().toLocaleTimeString())
      setIsWatchConnected(true)
    } catch (error: any) {
      if (error.message === "Not connected") {
        setIsWatchConnected(false)
        return // Handle silently
      }
      console.error("Watch sync error:", error)
      throw error
    }
  }

  const updateDailyGoal = (goals: Partial<NutritionContextType["dailyGoal"]>) => {
    setDailyGoal((prev) => ({ ...prev, ...goals }))
  }

  const updateProfile = (newProfile: Partial<NutritionContextType["profile"]>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }))
  }

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light")
  }

  const markNotificationsRead = () => {
    setNotificationsRead(true)
  }

  const login = (userData?: { name: string; email: string }) => {
    const newUser = userData || { name: "User", email: "" }
    const savedProfileRaw = localStorage.getItem("nru_profile")
    let savedProfile = null
    try {
      savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : null
    } catch (e) {
      console.error("Error parsing saved profile", e)
    }
    
    // If we have a saved profile and the email matches (and is not empty), don't clear data
    const isSameUser = savedProfile && newUser.email && savedProfile.email === newUser.email

    if (isSameUser) {
      localStorage.setItem("nru_auth", "true")
      setIsAuthenticated(true)
      setProfile(newUser)
      setTimeout(() => {
        window.location.replace("/")
      }, 100)
      return
    }

    const freshGoals = DEFAULT_GOALS
    const freshNotifications = DEFAULT_NOTIFICATIONS.map(n => ({ ...n, timestamp: Date.now() }))

    // 1. CLEAR EVERYTHING for a truly fresh start for the new user
    localStorage.clear()

    // 2. Persist fresh initial data immediately to localStorage
    localStorage.setItem("nru_meals", JSON.stringify([]))
    localStorage.setItem("nru_saved_recipes", JSON.stringify([]))
    localStorage.setItem("nru_notifications", JSON.stringify(freshNotifications))
    localStorage.setItem("nru_notifications_read", "false")
    localStorage.setItem("nru_hydration", JSON.stringify({ amount: 0, date: new Date().toDateString() }))
    localStorage.setItem("nru_sleep", JSON.stringify({ amount: 0, date: new Date().toDateString() }))
    localStorage.setItem("nru_steps", JSON.stringify({ amount: 0, date: new Date().toDateString() }))
    localStorage.setItem("nru_goals", JSON.stringify(freshGoals))
    localStorage.setItem("nru_profile", JSON.stringify(newUser))
    localStorage.setItem("nru_auth", "true")
    
    // 3. Update all state variables
    setMeals([])
    setSavedRecipes([])
    setUserRecipes([])
    setHydration(0)
    setSleep(0)
    setSteps(0)
    setNotifications(freshNotifications)
    setNotificationsRead(false)
    setLastSync(null)
    setIsWatchConnected(false)
    setProfile(newUser)
    setDailyGoal(freshGoals)
    setIsAuthenticated(true)
    
    // 4. Force a hard reload to ensure all components re-initialize
    setTimeout(() => {
      window.location.replace("/")
    }, 100)
  }

  const logout = () => {
    console.log("Logging out...");
    // Clear server-side session cookie
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("nru_auth");
    setIsAuthenticated(false);
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  }

  const todaysMeals = meals.filter(
    (m) => new Date(m.timestamp).toDateString() === new Date().toDateString()
  )

  const totals = todaysMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.info.calories,
      protein: acc.protein + meal.info.protein,
      carbs: acc.carbs + meal.info.carbs,
      fat: acc.fat + meal.info.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <NutritionContext.Provider
      value={{
        meals,
        savedRecipes,
        userRecipes,
        comments,
        hydration,
        sleep,
        steps,
        notifications,
        addNotification,
        clearNotifications,
        totalCalories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        addMeal,
        removeMeal,
        toggleSaveRecipe,
        addUserRecipe,
        removeUserRecipe,
        addComment,
        addHydration,
        addSleep,
        addSteps,
        syncWithWatch,
        isWatchConnected,
        setIsWatchConnected,
        lastSync,
        profile,
        dailyGoal,
        updateDailyGoal,
        updateProfile,
        isAuthenticated,
        notificationsRead,
        markNotificationsRead,
        login,
        logout,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </NutritionContext.Provider>
  )
}

export function useNutrition() {
  const context = useContext(NutritionContext)
  if (context === undefined) {
    throw new Error("useNutrition must be used within a NutritionProvider")
  }
  return context
}
