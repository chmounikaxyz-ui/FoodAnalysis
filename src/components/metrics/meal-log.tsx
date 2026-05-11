import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"

export function MealLog() {
  const { meals, removeMeal } = useNutrition()

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6 overflow-hidden flex flex-col h-[500px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Detailed Meal Log</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Macro breakdown of your recently analyzed meals</p>
        </div>
        <Badge variant="secondary" className="font-bold">
          {meals.length} Entries
        </Badge>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {meals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center gap-2">
            <Inbox className="w-10 h-10" />
            <p className="text-sm font-medium">No meals analyzed yet</p>
          </div>
        ) : (
          meals.map((meal) => {
            const protein = Math.round(meal.info.protein || 0)
            const carbs = Math.round(meal.info.carbs || 0)
            const fats = Math.round(meal.info.fat || 0)
            const totalMacros = (protein + carbs + fats) || 1
            const proteinPct = (protein / totalMacros) * 100
            const carbsPct = (carbs / totalMacros) * 100
            const fatsPct = (fats / totalMacros) * 100

            return (
              <div key={meal.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-3 group relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{meal.info.foodName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(meal.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="h-7 rounded-lg border-primary/10">
                      <span className="text-primary font-bold">{meal.info.calories}</span>
                      <span className="text-[10px] ml-1 opacity-60">kcal</span>
                    </Badge>
                    <button 
                      onClick={() => removeMeal(meal.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="bg-emerald-500 transition-all shadow-[inset_-1px_0_2px_rgba(0,0,0,0.1)]"
                      style={{ width: `${proteinPct}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all shadow-[inset_-1px_0_2px_rgba(0,0,0,0.1)]"
                      style={{ width: `${carbsPct}%` }}
                    />
                    <div
                      className="bg-orange-500 transition-all"
                      style={{ width: `${fatsPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-bold tracking-widest uppercase">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700">P <span className="opacity-60">{protein}g</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-700">C <span className="opacity-60">{carbs}g</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-orange-700">F <span className="opacity-60">{fats}g</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
