import * as React from "react"
import { cn } from "@/lib/utils"
import { Droplet, Moon, Zap } from "lucide-react"

import { useNutrition } from "@/lib/nutrition-context"

interface WellnessRingProps {
  item: { label: string; value: number; icon: any; color: string; hue: number };
  size?: number;
  strokeWidth?: number;
  key?: React.Key;
}

function WellnessRing({ item, size = 100, strokeWidth = 8 }: WellnessRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (item.value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-secondary/30 border border-border/50 flex-1">
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
            stroke={`oklch(0.55 0.18 ${item.hue})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <item.icon className="w-5 h-5 mb-1" style={{ color: `oklch(0.55 0.18 ${item.hue})` }} />
          <span className="text-xs font-black text-foreground">{item.value}%</span>
        </div>
      </div>
      <p className="text-[10px] font-bold text-foreground text-center uppercase tracking-widest">{item.label}</p>
    </div>
  )
}

export function GatHealthPanel() {
  const { hydration, sleep, steps, dailyGoal } = useNutrition()
  
  const hydrationScore = Math.min(Math.round((hydration / (dailyGoal.hydration || 2500)) * 100), 100)
  const sleepScore = Math.min(Math.round((sleep / (dailyGoal.sleep || 8)) * 100), 100)
  const activityScore = Math.min(Math.round((steps / (dailyGoal.steps || 10000)) * 100), 100)

  const wellness = [
    { label: "Hydration", value: hydrationScore, icon: Droplet, color: "text-blue-500", hue: 220 },
    { label: "Sleep", value: sleepScore, icon: Moon, color: "text-indigo-500", hue: 260 },
    { label: "Activity", value: activityScore, icon: Zap, color: "text-yellow-500", hue: 50 },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Wellness Metrics</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time health indicators</p>
      </div>

      <div className="flex flex-col gap-4">
        {wellness.map((item) => (
          <WellnessRing key={item.label} item={item} />
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">AI Insights:</p>
        <ul className="space-y-2">
          <InsightItem text="Hydration is low. Drink 2L water to reach goal." />
          <InsightItem text="Sleep quality was optimal. Morning workout recommended." />
          <InsightItem text="Activity level is below average for a Tuesday." />
        </ul>
      </div>
    </div>
  )
}

function InsightItem({ text }: { text: string }) {
  return (
    <li className="text-[11px] text-muted-foreground flex gap-2 leading-relaxed">
      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mt-1 shrink-0" />
      {text}
    </li>
  )
}
