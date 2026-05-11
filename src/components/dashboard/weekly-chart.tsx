import * as React from "react"
import { useState } from "react"
import { useNutrition } from "@/lib/nutrition-context"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

const data = [
  { day: "Mon", calories: 1950, protein: 105, carbs: 230 },
  { day: "Tue", calories: 2100, protein: 115, carbs: 245 },
  { day: "Wed", calories: 1800, protein: 92, carbs: 198 },
  { day: "Thu", calories: 2050, protein: 108, carbs: 220 },
  { day: "Fri", calories: 1920, protein: 100, carbs: 215 },
  { day: "Sat", calories: 2200, protein: 118, carbs: 260 },
  { day: "Sun", calories: 1847, protein: 98, carbs: 210 },
]

const metrics = [
  { key: "calories", label: "Calories", color: "var(--color-chart-4)", target: 2100 },
  { key: "protein", label: "Protein", color: "var(--color-chart-1)", target: 120 },
  { key: "carbs", label: "Carbs", color: "var(--color-chart-3)", target: 250 },
] as const

type MetricKey = (typeof metrics)[number]["key"]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">
            {entry.value.toLocaleString()}
            {entry.name === "Calories" ? "" : "g"}
          </span>
        </div>
      ))}
    </div>
  )
}

export function WeeklyChart() {
  const { meals, dailyGoal } = useNutrition()
  const [activeMetric, setActiveMetric] = useState<MetricKey>("calories")
  
  const chartData = React.useMemo(() => {
    if (meals.length === 0) return []
    
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({
        fullDate: d.toDateString(),
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        calories: 0,
        protein: 0,
        carbs: 0,
      })
    }

    meals.forEach((meal) => {
      const mealDate = new Date(meal.timestamp).toDateString()
      const dayData = days.find((d) => d.fullDate === mealDate)
      if (dayData) {
        dayData.calories += Math.round(meal.info.calories)
        dayData.protein += Math.round(meal.info.protein)
        dayData.carbs += Math.round(meal.info.carbs)
      }
    })

    return days
  }, [meals])

  const currentMetric = metrics.find((m) => m.key === activeMetric)!
  const currentTarget = activeMetric === "calories" ? dailyGoal.calories : (activeMetric === "protein" ? dailyGoal.protein : dailyGoal.carbs)

  const avg = chartData.length > 0 
    ? Math.round(chartData.reduce((s, d) => s + (d[activeMetric] as number), 0) / chartData.length)
    : 0

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Weekly Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avg {avg.toLocaleString()}
            {activeMetric === "calories" ? " kcal" : "g"} / day
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 self-stretch sm:self-auto">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={cn(
                "flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                activeMetric === m.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[260px] mt-4 relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/20 rounded-xl border border-dashed border-border">
            <Inbox className="w-8 h-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground font-medium">No trend data available yet</p>
            <p className="text-[10px] text-muted-foreground opacity-60">Log your first meal to see progress</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentMetric.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={currentMetric.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={currentTarget}
                stroke={currentMetric.color}
                strokeDasharray="6 4"
                strokeOpacity={0.4}
                label={{
                  value: "Target",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={currentMetric.color}
                strokeWidth={2.5}
                fill={`url(#fill-${activeMetric})`}
                name={currentMetric.label}
                dot={{ r: 4, fill: "var(--color-card)", stroke: currentMetric.color, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: currentMetric.color, stroke: "var(--color-card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
