import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Camera, Flame, Dumbbell, ChevronRight, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { useNutrition } from "@/lib/nutrition-context"

function getScoreStyle(score: number) {
  if (score >= 90) return "bg-primary/10 text-primary border-primary/20"
  if (score >= 80) return "bg-accent/10 text-accent-foreground border-accent/20"
  return "bg-muted text-muted-foreground border-border"
}

export function RecentMeals() {
  const { meals } = useNutrition()
  
  // Only show today's meals or just the latest few for "Recent"
  const recentMeals = meals.slice(0, 5)

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Meals</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your analyzed meals</p>
        </div>
        <Link to="/analysis">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
            <Camera className="w-3.5 h-3.5" />
            Scan Meal
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {recentMeals.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl opacity-60">
            <Inbox className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent meals found</p>
          </div>
        ) : (
          recentMeals.map((meal) => (
            <div
              key={meal.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-border shadow-sm">
                <img
                  src={meal.imageUrl || "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=400&fit=crop"}
                  alt={meal.info.foodName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{meal.info.foodName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Flame className="w-3 h-3" />
                    {meal.info.calories} kcal
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Dumbbell className="w-3 h-3" />
                    {meal.info.protein}g
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className={cn("text-xs font-bold border", getScoreStyle(meal.info.healthScore))}>
                  {meal.info.healthScore}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
