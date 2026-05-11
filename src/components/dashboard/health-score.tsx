import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, Droplets, Dumbbell, Apple, Timer, Moon, Zap } from "lucide-react"
import { useNutrition } from "@/lib/nutrition-context"

function ScoreRing({ score, size = 140, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-foreground tracking-tight">{score}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">out of 100</span>
      </div>
    </div>
  )
}

export function HealthScore() {
  const { meals, hydration, sleep, steps, dailyGoal } = useNutrition()
  
  // Calculate average health score from today's meals
  const today = new Date().setHours(0, 0, 0, 0)
  const todaysMeals = meals.filter(m => m.timestamp >= today)
  
  const overallScore = todaysMeals.length > 0 
    ? Math.round(todaysMeals.reduce((acc, m) => acc + m.info.healthScore, 0) / todaysMeals.length)
    : 0

  const hydrationScore = Math.min(Math.round((hydration / (dailyGoal.hydration || 2500)) * 100), 100)
  const sleepScore = Math.min(Math.round((sleep / (dailyGoal.sleep || 8)) * 100), 100)
  const activityScore = Math.min(Math.round((steps / (dailyGoal.steps || 10000)) * 100), 100)

  const categories = [
    { label: "Hydration", value: hydrationScore, icon: Droplets, hue: 220 },
    { label: "Macros", value: overallScore > 0 ? Math.min(overallScore + 5, 100) : 0, icon: Dumbbell, hue: 155 },
    { label: "Sleep", value: sleepScore, icon: Moon, hue: 260 },
    { label: "Activity", value: activityScore, icon: Zap, hue: 50 },
  ]

  const previousScore = todaysMeals.length > 0 ? 75 : 0 // Mock historical
  const diff = overallScore - previousScore

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">GatHealth Score</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your daily wellness index</p>
        </div>
        {diff > 0 && (
          <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            +{diff} pts
          </div>
        )}
      </div>

      <div className="flex items-center justify-center">
        <ScoreRing score={overallScore} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => {
          const pct = cat.value
          return (
            <div key={cat.label} className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/40">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: `oklch(0.95 0.03 ${cat.hue} / 0.1)` }}
                >
                  <cat.icon className="w-4 h-4" style={{ color: `oklch(0.50 0.15 ${cat.hue})` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-foreground truncate leading-none mb-1">{cat.label}</span>
                    <span className={cn(
                      "text-[10px] font-bold leading-none",
                      pct >= 80 ? "text-primary" : pct >= 60 ? "text-accent-foreground" : "text-destructive"
                    )}>
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `oklch(0.55 0.15 ${cat.hue})`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
