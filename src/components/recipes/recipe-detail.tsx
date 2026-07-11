import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Clock, Users, Flame, Share2, Bookmark, Heart, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"

interface RecipeDetailProps {
  recipe: {
    id: string | number
    title: string
    author: string
    image: string
    description: string
    healthScore: number
    calories: number
    prepTime: string
    servings: number
    nutrition: { protein: number; carbs: number; fat: number; fiber: number }
    ingredients: Array<{ amount: string; name: string }>
    steps: Array<{ title: string; description: string }>
    isCustom?: boolean
    openAtComments?: boolean
  }
  onClose: () => void
}

const displayValue = (val: any) => {
  if (val === null || val === undefined) return "0";
  if (typeof val === "number" && isNaN(val)) return "0";
  return val;
};

export function RecipeDetail({ recipe, onClose }: RecipeDetailProps) {
  const { savedRecipes, toggleSaveRecipe, removeUserRecipe, comments, addComment, profile } = useNutrition()
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([])
  const [isCooking, setIsCooking] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [commentText, setCommentText] = useState("")
  const commentsRef = useRef<HTMLElement>(null)

  const recipeComments = comments.filter(c => c.recipeId === recipe.id.toString())

  useEffect(() => {
    if (recipe.openAtComments && commentsRef.current) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [recipe.openAtComments]);

  const isSaved = savedRecipes.some(r => r.id === recipe.id.toString())

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    addComment(recipe.id.toString(), commentText);
    setCommentText("");
  };

  const handleToggleSave = () => {
    toggleSaveRecipe({
      ...recipe,
      id: recipe.id.toString()
    })
  }

  const handleDelete = () => {
    if (showConfirmDelete) {
      removeUserRecipe(recipe.id);
      onClose();
    } else {
      setShowConfirmDelete(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  }

  if (isCooking) {
    const step = recipe.steps[currentStep]
    return (
      <div className="fixed inset-0 z-[70] bg-background flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
               {currentStep + 1}
             </div>
             <p className="text-sm font-bold truncate max-w-[200px]">{recipe.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsCooking(false)}>
            Exit
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 text-center max-w-2xl mx-auto">
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight line-clamp-2">
              {step.title}
            </h2>
            <div className="bg-secondary/30 p-8 rounded-[32px] border border-border shadow-sm min-h-[200px] flex items-center justify-center">
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-4 max-w-2xl mx-auto w-full">
           <Button 
            variant="outline" 
            size="lg" 
            className="flex-1 h-16 rounded-2xl"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
           >
             Back
           </Button>
           <Button 
            size="lg" 
            className="flex-1 h-16 rounded-2xl"
            onClick={() => {
              if (currentStep < recipe.steps.length - 1) {
                setCurrentStep(prev => prev + 1)
              } else {
                setIsCooking(false)
                setCurrentStep(0)
              }
            }}
           >
             {currentStep === recipe.steps.length - 1 ? "Finish Cooking" : "Next Step"}
           </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center lg:justify-end p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full lg:max-w-2xl bg-card lg:rounded-l-3xl shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <h2 className="text-base font-bold text-foreground line-clamp-1 max-w-[200px]">
               {recipe.title}
             </h2>
             {recipe.isCustom && (
               <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] py-0 h-5">
                 My Recipe
               </Badge>
             )}
          </div>
          <div className="flex items-center gap-1">
            {recipe.isCustom && (
              <Button
                variant={showConfirmDelete ? "destructive" : "ghost"}
                size={showConfirmDelete ? "sm" : "icon"}
                onClick={handleDelete}
                className={cn(
                  "h-8 transition-all duration-300",
                  showConfirmDelete ? "px-3 text-[10px] font-bold rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm" : "w-8 text-muted-foreground hover:text-red-500"
                )}
              >
                {showConfirmDelete ? (
                   "Delete?"
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 pb-28">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="object-cover w-full h-full text-[0]"
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground text-xs font-bold shadow-lg ring-1 ring-white/20">
                AI Score: {recipe.healthScore}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 sticky top-[60px] z-20 bg-card/95 backdrop-blur-md -mx-6 px-6 py-3 border-b border-border shadow-sm">
            <Button 
                variant="outline" 
                size="lg" 
                onClick={handleToggleSave} 
                className={cn(
                    "flex-1 h-12 rounded-full font-bold shadow-sm transition-all active:scale-95 border-border bg-white text-foreground hover:bg-slate-50",
                    isSaved && "border-primary/20 bg-primary/5"
                )}
            >
              <Bookmark className={cn("w-5 h-5 mr-3 transition-transform", isSaved ? "fill-primary text-primary scale-110" : "text-muted-foreground")} />
              <span className="text-sm tracking-tight">{isSaved ? "Saved" : "Save"}</span>
            </Button>
            <Button size="lg" className="flex-[1.2] h-12 rounded-full font-bold shadow-sm" onClick={() => setIsCooking(true)}>
              Cook Together
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-2xl shrink-0 active:scale-95 transition-transform"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: recipe.title,
                    text: recipe.description,
                    url: window.location.href,
                  }).catch(() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3 pt-6">
            <StatItem icon={<Flame className="w-4 h-4 text-orange-500" />} value={recipe.calories} unit="kcal" label="Calories" />
            <StatItem icon={<Clock className="w-4 h-4 text-amber-500" />} value={recipe.prepTime} unit="" label="Prep" />
            <StatItem icon={<Users className="w-4 h-4 text-emerald-600" />} value={recipe.servings} unit="" label="Servings" />
            <StatItem icon={<Heart className="w-4 h-4 text-red-500" />} value={`${recipe.healthScore}%`} unit="" label="Health" />
          </div>

          <section className="mt-2">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Macros per serving
            </h3>
            <div className="grid grid-cols-4 gap-2 pt-1">
              <MacroItem label="Protein" value={recipe.nutrition.protein} color="bg-emerald-600" />
              <MacroItem label="Carbs" value={recipe.nutrition.carbs} color="bg-amber-500" />
              <MacroItem label="Fat" value={recipe.nutrition.fat} color="bg-orange-500" />
              <MacroItem label="Fiber" value={recipe.nutrition.fiber} color="bg-teal-500" />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Ingredients
            </h3>
            <div className="space-y-1.5">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                  onClick={() => toggleIngredient(idx)}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border border-border flex items-center justify-center transition-colors",
                    checkedIngredients.includes(idx) ? "bg-primary border-primary" : "bg-card"
                  )}>
                    {checkedIngredients.includes(idx) && <X className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <p className={cn(
                    "text-sm",
                    checkedIngredients.includes(idx) ? "text-muted-foreground line-through" : "text-foreground font-medium"
                  )}>
                    {ing.amount} <span className="font-normal opacity-80">{ing.name}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Preparation
            </h3>
            <div className="space-y-4">
              {recipe.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-bold shrink-0 border border-primary/20">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t border-border" ref={commentsRef}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Comments
            </h3>
            
            <div className="space-y-3 mb-6">
              {recipeComments.map(c => (
                <div key={c.id} className="bg-secondary/20 rounded-2xl p-4 border border-border/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-primary">
                      {c.author === profile?.name ? "You" : (c.author || "Anonymous")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{c.date}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 h-10 rounded-xl bg-secondary/40 border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              />
              <Button size="sm" className="rounded-xl px-4 h-10" onClick={handlePostComment} disabled={!commentText.trim()}>Post</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon, value, unit, label }: { icon: React.ReactNode, value: any, unit: string, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 pt-5 pb-5 rounded-2xl bg-secondary/40 border border-border/50 min-w-0 transition-all hover:bg-secondary/60">
      <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center mb-1 shadow-sm border border-border/50 shrink-0">
        {icon}
      </div>
      <div className="flex flex-col items-center gap-1 min-w-0 w-full overflow-hidden">
        <span className="text-sm font-black text-foreground tracking-tight leading-none truncate w-full text-center">
          {displayValue(value)}<span className="text-[10px] ml-0.5 opacity-60 font-medium">{unit}</span>
        </span>
        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none truncate w-full text-center">
          {label}
        </span>
      </div>
    </div>
  )
}

function MacroItem({ label, value, color }: { label: string, value: number, color: string }) {
  const safeValue = isNaN(value) ? 0 : value;
  return (
    <div className="p-3 pt-4 rounded-2xl bg-secondary/30 border border-border/30 flex flex-col gap-1 transition-shadow">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none truncate">
        {label}
      </p>
      <div className="flex items-baseline gap-0.5 truncate mt-0.5">
        <span className={cn("text-base font-black leading-none", color.replace('bg-', 'text-'))}>{displayValue(value)}</span>
        <span className="text-[10px] opacity-60 uppercase font-bold">g</span>
      </div>
      <div className="w-full h-1 bg-border/50 rounded-full mt-2 overflow-hidden">
        <div className={cn("h-full transition-all duration-500", color)} style={{ width: `${Math.min(safeValue * 2, 100)}%` }} />
      </div>
    </div>
  )
}
