import * as React from "react"
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
import { Inbox } from "lucide-react"

const data = [
  { day: "May 26", calories: 1850 },
  { day: "May 27", calories: 2050 },
  { day: "May 28", calories: 1900 },
  { day: "May 29", calories: 2100 },
  { day: "May 30", calories: 1950 },
  { day: "May 31", calories: 2200 },
  { day: "Jun 1", calories: 1847 },
  { day: "Jun 2", calories: 2000 },
  { day: "Jun 3", calories: 1920 },
  { day: "Jun 4", calories: 2050 },
  { day: "Jun 5", calories: 1800 },
  { day: "Jun 6", calories: 2100 },
  { day: "Jun 7", calories: 1950 },
  { day: "Jun 8", calories: 2020 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mt-1">
          <span className="text-xs text-muted-foreground">{entry.name}</span>
          <span className="text-xs font-semibold text-foreground">{entry.value} kcal</span>
        </div>
      ))}
    </div>
  )
}

export function CalorieTrend() {
  const { meals, dailyGoal } = useNutrition()
  
  const chartData = React.useMemo(() => {
    if (meals.length === 0) return []
    
    const days = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({
        fullDate: d.toDateString(),
        day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        calories: 0,
      })
    }

    meals.forEach((meal) => {
      const mealDate = new Date(meal.timestamp).toDateString()
      const dayData = days.find((d) => d.fullDate === mealDate)
      if (dayData) {
        dayData.calories += Math.round(meal.info.calories)
      }
    })

    return days
  }, [meals])

  const avg = chartData.length > 0 
    ? Math.round(chartData.reduce((s, d) => s + d.calories, 0) / chartData.length)
    : 0

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Calorie Trend (14 Days)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Avg {avg} kcal / day
        </p>
      </div>

      <div className="h-[260px] mt-4 relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/20 rounded-xl border border-dashed border-border text-center p-4">
            <Inbox className="w-8 h-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground font-bold">No history available</p>
            <p className="text-[10px] text-muted-foreground max-w-[180px]">Your 14-day calorie progression will appear here as you log meals.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="fill-calories-trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0.02} />
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
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={dailyGoal.calories}
                stroke="var(--color-chart-4)"
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
                dataKey="calories"
                stroke="var(--color-chart-4)"
                strokeWidth={2.5}
                fill="url(#fill-calories-trend)"
                name="Calories"
                dot={false}
                activeDot={{ r: 6, fill: "var(--color-chart-4)", stroke: "var(--color-card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
