import * as React from "react"
import { cn } from "@/lib/utils"
import { Droplet, Moon, Zap } from "lucide-react"

import { useNutrition } from "@/lib/nutrition-context"

interface WellnessRingProps {
  item: { label: string; value: number; raw: string; icon: any; color: string; hue: number; hasData: boolean };
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
            stroke={item.hasData ? `oklch(0.55 0.18 ${item.hue})` : "var(--color-border)"}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <item.icon className="w-5 h-5 mb-1" style={{ color: item.hasData ? `oklch(0.55 0.18 ${item.hue})` : "var(--color-muted-foreground)" }} />
          <span className="text-xs font-black text-foreground">{item.hasData ? `${item.value}%` : "—"}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold text-foreground text-center uppercase tracking-widest">{item.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{item.raw}</p>
      </div>
    </div>
  )
}

export function GatHealthPanel() {
  const { hydration, sleep, steps, dailyGoal, isWatchConnected, lastSync } = useNutrition()
  
  const hydrationScore = Math.min(Math.round((hydration / (dailyGoal.hydration || 2500)) * 100), 100)
  const sleepScore = Math.min(Math.round((sleep / (dailyGoal.sleep || 8)) * 100), 100)
  const activityScore = Math.min(Math.round((steps / (dailyGoal.steps || 10000)) * 100), 100)

  const wellness = [
    { 
      label: "Hydration", 
      value: hydrationScore, 
      raw: hydration > 0 ? `${hydration}ml` : "No data",
      icon: Droplet, 
      color: "text-blue-500", 
      hue: 220,
      hasData: hydration > 0
    },
    { 
      label: "Sleep", 
      value: sleepScore, 
      raw: sleep > 0 ? `${sleep}h (estimated)` : "No data",
      icon: Moon, 
      color: "text-indigo-500", 
      hue: 260,
      hasData: sleep > 0
    },
    { 
      label: "Activity", 
      value: activityScore, 
      raw: steps > 0 ? `${steps.toLocaleString()} steps` : "No data",
      icon: Zap, 
      color: "text-yellow-500", 
      hue: 50,
      hasData: steps > 0
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Wellness Metrics</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isWatchConnected && lastSync
            ? `Last synced at ${lastSync}`
            : "Connect your watch to see live data"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {wellness.map((item) => (
          <WellnessRing key={item.label} item={item} />
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">Note:</p>
        <ul className="space-y-2">
          <InsightItem text={steps > 0 ? `${steps.toLocaleString()} steps synced from your Fastrack watch.` : "Steps will appear after syncing your watch."} />
          <InsightItem text={sleep > 0 ? `Sleep estimated from your dinner & breakfast meal times.` : "Log dinner tonight and breakfast tomorrow to estimate sleep."} />
          <InsightItem text="Hydration is not synced by Fastrack. Use the Water Tracker to log intake." />
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
