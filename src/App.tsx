import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from "@/components/app-shell";
import { NutritionProvider, useNutrition } from "@/lib/nutrition-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Settings as SettingsIcon, Save, Camera, Droplets } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Pages
import { StatCards } from "@/components/dashboard/stat-cards";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { RecentMeals } from "@/components/dashboard/recent-meals";
import { HealthScore } from "@/components/dashboard/health-score";
import { HealthConnectButton } from "@/components/dashboard/watch-connection";
import { MealChat } from "@/components/analysis/meal-chat";
import { RecipesFeed } from "@/components/recipes/recipes-feed";
import { MacroRings } from "@/components/metrics/macro-rings";
import { CalorieTrend } from "@/components/metrics/calorie-trend";
import { MealLog } from "@/components/metrics/meal-log";
import { GatHealthPanel } from "@/components/metrics/gathealth-panel";
import { WaterTracker } from "@/components/metrics/water-tracker";
import { LandingPage } from "@/components/landing-page";

function AuthenticatedApp() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/water" element={<Water />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default function App() {
  return (
    <NutritionProvider>
      <AppContent />
    </NutritionProvider>
  );
}



function Dashboard() {
  const { profile } = useNutrition();
  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
            {greeting}, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {"Here's"} your nutrition summary for today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HealthConnectButton />
          <Link to="/analysis">
            <Button className="rounded-full gap-2 shadow-lg shadow-primary/20">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Analyze Meal</span>
            </Button>
          </Link>
        </div>
      </div>

      <StatCards />

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>
        <div className="flex flex-col gap-4 lg:gap-6">
          <HealthScore />
        </div>
      </div>

      <RecentMeals />
    </div>
  );
}

function Analysis() {
  return (
    <div className="h-full bg-background">
      <MealChat />
    </div>
  );
}

function Recipes() {
  return (
    <div className="p-4 lg:p-8 bg-background min-h-full">
      <RecipesFeed />
    </div>
  );
}

function Metrics() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 bg-background">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
          Daily Metrics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your nutrition and wellness goals
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
          <MacroRings />
          <CalorieTrend />
          <MealLog />
        </div>
        <div className="flex flex-col gap-4 lg:gap-6">
          <GatHealthPanel />
        </div>
      </div>
    </div>
  );
}

function Water() {
  const { hydration, dailyGoal } = useNutrition()
  const goal = dailyGoal.hydration || 2500
  const pct = Math.min(Math.round((hydration / goal) * 100), 100)
  const targetMet = hydration >= goal

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 bg-background min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Water Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Stay hydrated — track intake and set smart reminders</p>
          </div>
        </div>
        <span className={cn(
          "text-sm font-bold px-3 py-1.5 rounded-full",
          targetMet ? "text-emerald-600 bg-emerald-500/10" : "text-primary bg-primary/10"
        )}>
          {hydration}ml / {goal}ml
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Left — stats + progress */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Big progress ring */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center gap-4">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" strokeWidth="10"/>
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={targetMet ? "#10b981" : "var(--color-primary)"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{pct}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">of goal</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">{hydration.toLocaleString()}ml</p>
              <p className="text-xs text-muted-foreground">
                {targetMet ? "🎉 Daily goal reached!" : `${(goal - hydration).toLocaleString()}ml remaining`}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Consumed</p>
              <p className="text-xl font-black text-primary">{hydration}<span className="text-xs font-normal text-muted-foreground ml-1">ml</span></p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Goal</p>
              <p className="text-xl font-black text-foreground">{goal}<span className="text-xs font-normal text-muted-foreground ml-1">ml</span></p>
            </div>
          </div>
        </div>

        {/* Right — tracker card (reminders only, no duplicate header/progress) */}
        <div className="lg:col-span-2">
          <WaterTracker />
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const { dailyGoal, updateDailyGoal, profile, updateProfile } = useNutrition();
  const [goals, setGoals] = React.useState(dailyGoal);
  const [userProfile, setUserProfile] = React.useState(profile);
  
  const [isSavingGoals, setIsSavingGoals] = React.useState(false);
  const [showGoalsSuccess, setShowGoalsSuccess] = React.useState(false);
  
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoUrl = event.target?.result as string;
        setUserProfile(prev => ({ ...prev, photo: photoUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGoals = () => {
    setIsSavingGoals(true);
    updateDailyGoal(goals);
    
    setTimeout(() => {
      setIsSavingGoals(false);
      setShowGoalsSuccess(true);
      setTimeout(() => setShowGoalsSuccess(false), 3000);
    }, 600);
  };

  const handleSaveProfile = () => {
    setIsSavingProfile(true);
    updateProfile(userProfile);
    setTimeout(() => {
      setIsSavingProfile(false);
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-8 bg-background min-h-full">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Profile & Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize your nutrition targets</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Daily Nutrition Targets</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Calorie Goal</label>
              <Input 
                type="number" 
                value={goals.calories || ""} 
                onChange={(e) => setGoals({...goals, calories: e.target.value === "" ? 0 : Number(e.target.value)})}
                className="bg-secondary/50"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Protein (g)</label>
                <Input 
                  type="number" 
                  value={goals.protein || ""} 
                  onChange={(e) => setGoals({...goals, protein: e.target.value === "" ? 0 : Number(e.target.value)})}
                  className="bg-secondary/50"
                />
              </div>
               <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Carbs (g)</label>
                <Input 
                  type="number" 
                  value={goals.carbs || ""} 
                  onChange={(e) => setGoals({...goals, carbs: e.target.value === "" ? 0 : Number(e.target.value)})}
                  className="bg-secondary/50"
                />
              </div>
               <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fat (g)</label>
                <Input 
                  type="number" 
                  value={goals.fat || ""} 
                  onChange={(e) => setGoals({...goals, fat: e.target.value === "" ? 0 : Number(e.target.value)})}
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hydration (ml)</label>
                <Input 
                  type="number" 
                  value={goals.hydration || ""} 
                  onChange={(e) => setGoals({...goals, hydration: e.target.value === "" ? 0 : Number(e.target.value)})}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sleep (h)</label>
                <Input 
                  type="number" 
                  value={goals.sleep || ""} 
                  onChange={(e) => setGoals({...goals, sleep: e.target.value === "" ? 0 : Number(e.target.value)})}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Steps</label>
                <Input 
                  type="number" 
                  value={goals.steps || ""} 
                  onChange={(e) => setGoals({...goals, steps: e.target.value === "" ? 0 : Number(e.target.value)})}
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <Button 
              onClick={handleSaveGoals} 
              className={cn("w-full mt-4 gap-2 transition-all", showGoalsSuccess ? "bg-green-600 hover:bg-green-600" : "")}
              disabled={isSavingGoals}
            >
              {isSavingGoals ? "Saving..." : showGoalsSuccess ? "Goals Saved!" : "Save Goals"}
              {!isSavingGoals && !showGoalsSuccess && <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">Account Information</h3>
            
            {/* Profile Photo Uploader Section */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-secondary/20 border border-border/50">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl relative overflow-hidden shrink-0">
                {userProfile.photo ? (
                  <img src={userProfile.photo} className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "U"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profile Photo</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg text-xs font-bold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Photo
                  </Button>
                  {userProfile.photo && (
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-lg text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setUserProfile(prev => ({ ...prev, photo: undefined }))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</label>
                <Input 
                  value={userProfile.name} 
                  onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  className="bg-secondary/50" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <Input 
                  value={userProfile.email} 
                  readOnly
                  className="bg-secondary/30 text-muted-foreground cursor-not-allowed" 
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveProfile}
            variant="outline"
            className={cn("w-full gap-2 transition-all border-dashed", showProfileSuccess ? "border-green-500 text-green-600 bg-green-50/50" : "")}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Updating..." : showProfileSuccess ? "Profile Updated!" : "Update Account Info"}
            {!isSavingProfile && !showProfileSuccess && <Save className="w-4 h-4 opacity-50" />}
          </Button>

          <p className="text-[10px] text-muted-foreground mt-auto italic leading-relaxed">
            Note: These values are used to calculate your health scores and remaining daily allowance.
          </p>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const { theme, toggleTheme, addNotification } = useNutrition();
  const [settings, setSettings] = React.useState({
    notifications: true,
    healthKit: false,
    privacy: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    if (key === "notifications") {
      addNotification({
        title: newValue ? "Notifications Enabled" : "Notifications Disabled",
        desc: newValue ? "You'll receive meal reminders and health insights." : "Push notifications have been turned off.",
        type: "info"
      });
    }
    
    if (key === "healthKit" && newValue) {
      addNotification({
        title: "HealthKit Integration",
        desc: "Connect your watch from the Dashboard to sync steps and activity data.",
        type: "info"
      });
    }
  };

  const settingsList = [
    { id: "notifications" as const, label: "Push Notifications", desc: "Get meal reminders and health insights", value: settings.notifications, onToggle: () => toggleSetting("notifications") },
    { id: "darkMode" as const, label: "Dark Mode", desc: "Switch between light and dark themes", value: theme === "dark", onToggle: toggleTheme },
    { id: "healthKit" as const, label: "Integrate HealthKit", desc: "Sync steps and activity data", value: settings.healthKit, onToggle: () => toggleSetting("healthKit") },
    { id: "privacy" as const, label: "Privacy Policy", desc: "Read how we handle your data", value: settings.privacy, onToggle: () => toggleSetting("privacy") }
  ];

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 bg-background min-h-full">
       <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center border border-border">
          <SettingsIcon className="w-8 h-8 text-foreground" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your app preferences</p>
        </div>
      </div>
      
      <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden max-w-2xl">
        {settingsList.map((item) => (
          <div 
            key={item.id} 
            className="p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors cursor-pointer"
            onClick={item.onToggle}
          >
            <div>
              <p className="text-sm font-bold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <div className={cn(
              "w-10 h-6 rounded-full flex items-center px-1 transition-colors border",
              item.value ? "bg-primary border-primary" : "bg-secondary border-border"
            )}>
              <motion.div 
                animate={{ x: item.value ? 16 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, login } = useNutrition();

  if (!isAuthenticated) {
    return <LandingPage onGetStarted={login} />;
  }

  return <AuthenticatedApp />;
}
