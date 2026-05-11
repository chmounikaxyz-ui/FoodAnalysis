import * as React from "react"
import { Flame, Drumstick, Wheat, LeafyGreen, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"

export function StatCards() {
  const { meals, dailyGoal, totalCalories, protein, carbs, fat } = useNutrition()
  
  // Need this for the 'change' mock logic
  const today = new Date().setHours(0, 0, 0, 0)
  const todaysMeals = meals.filter(m => m.timestamp >= today)
  
  const stats = [
    {
      label: "Calories",
      value: totalCalories,
      target: dailyGoal.calories,
      unit: "kcal",
      change: todaysMeals.length > 0 ? -8 : 0, // MOCK for visual
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      barColor: "bg-orange-500",
      borderAccent: "border-orange-500/40",
    },
    {
      label: "Protein",
      value: protein,
      target: dailyGoal.protein,
      unit: "g",
      change: todaysMeals.length > 0 ? 12 : 0,
      icon: Drumstick,
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
      barColor: "bg-emerald-600",
      borderAccent: "border-emerald-600/40",
    },
    {
      label: "Carbs",
      value: carbs,
      target: dailyGoal.carbs,
      unit: "g",
      change: todaysMeals.length > 0 ? -3 : 0,
      icon: Wheat,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      barColor: "bg-amber-500",
      borderAccent: "border-amber-500/40",
    },
    {
      label: "Fats",
      value: fat,
      target: dailyGoal.fat,
      unit: "g",
      change: todaysMeals.length > 0 ? 5 : 0,
      icon: LeafyGreen,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      barColor: "bg-teal-500",
      borderAccent: "border-teal-500/40",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map((stat) => {
        const pctVal = Math.round((stat.value / (stat.target || 1)) * 100)
        const pct = isNaN(pctVal) ? 0 : Math.min(pctVal, 100)
        return (
          <div
            key={stat.label}
            className={cn(
              "bg-card rounded-xl border-[1.5px] p-4 lg:p-5 flex flex-col gap-3",
              stat.borderAccent
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-[18px] h-[18px]", stat.color)} />
              </div>
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
                  stat.change > 0
                    ? "text-emerald-600 bg-emerald-600/10"
                    : "text-orange-500 bg-orange-500/10"
                )}
              >
                {stat.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(stat.change)}%
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {stat.value.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-0.5">
                  {stat.unit}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label} / {stat.target.toLocaleString()} target
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", stat.barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right font-medium">{pct}%</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
