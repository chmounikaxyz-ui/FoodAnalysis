import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from "@/components/app-shell";
import { NutritionProvider, useNutrition } from "@/lib/nutrition-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Settings as SettingsIcon, Save, Camera } from "lucide-react";
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
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
            Good afternoon, {profile.name.split(' ')[0]}
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
        <div>
          <GatHealthPanel />
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { dailyGoal, updateDailyGoal, profile, updateProfile } = useNutrition();
  const [goals, setGoals] = React.useState(dailyGoal);
  const [userProfile, setUserProfile] = React.useState(profile);
  
  const [isSavingGoals, setIsSavingGoals] = React.useState(false);
  const [showGoalsSuccess, setShowGoalsSuccess] = React.useState(false);
  
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = React.useState(false);

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
      setIsSavingProfile(true); // Small flick for UX
      setTimeout(() => {
        setIsSavingProfile(false);
        setShowProfileSuccess(true);
        setTimeout(() => setShowProfileSuccess(false), 3000);
      }, 400);
    }, 200);
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
  const { theme, toggleTheme } = useNutrition();
  const [settings, setSettings] = React.useState({
    notifications: true,
    healthKit: false,
    privacy: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    if (key === "notifications") {
      alert(newValue ? "Push notifications enabled!" : "Push notifications disabled.");
    }
    
    if (key === "healthKit" && newValue) {
      alert("Integrating with HealthKit... Steps and activity will be synced.");
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
