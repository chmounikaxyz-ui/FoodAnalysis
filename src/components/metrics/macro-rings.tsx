import * as React from "react"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"

interface MacroRingProps {
  macro: { label: string; value: number; target: number; unit: string; color: string };
  size?: number;
  strokeWidth?: number;
  key?: string | number;
}

function MacroRing({ macro, size = 120, strokeWidth = 10 }: MacroRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // Ensure values are numbers to prevent NaN in calculations
  const safeValue = Number(macro.value) || 0
  const safeTarget = Number(macro.target) || 0
  
  const pct = safeTarget > 0 ? Math.min((safeValue / safeTarget) * 100, 100) : 0
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-secondary/30 border border-border/50 flex-1 min-w-[140px]">
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
            stroke={macro.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={isNaN(circumference) ? 0 : circumference}
            strokeDashoffset={isNaN(offset) ? 0 : offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-foreground">{safeValue}</span>
            <span className="text-[10px] text-muted-foreground font-medium">/&nbsp;{safeTarget}</span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">{macro.unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider">{macro.label}</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{pct.toFixed(0)}% of target</p>
      </div>
    </div>
  )
}

export function MacroRings() {
  const { protein, carbs, fat, dailyGoal } = useNutrition()
  
  const displayMacros = [
    { label: "Protein", value: protein, target: dailyGoal.protein, unit: "g", color: "var(--color-chart-1)" },
    { label: "Carbs", value: carbs, target: dailyGoal.carbs, unit: "g", color: "var(--color-chart-3)" },
    { label: "Fats", value: fat, target: dailyGoal.fat, unit: "g", color: "var(--color-chart-2)" },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Macronutrient Targets</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Daily progress toward performance goals</p>
      </div>

      <div className="flex flex-wrap items-center justify-around gap-4">
        {displayMacros.map((macro) => (
          <MacroRing key={macro.label} macro={macro} />
        ))}
      </div>
    </div>
  )
}
