import * as React from "react"
import { useState } from "react"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { RecipeDetail } from "@/components/recipes/recipe-detail"
import { Button } from "@/components/ui/button"
import { Flame, TrendingUp, Clock, Bookmark, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"
import { AddRecipeModal } from "@/components/recipes/add-recipe-modal"
import { Recipe } from "@/types"

const filterTabs = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "top-rated", label: "Top Rated", icon: Flame },
  { id: "saved", label: "Saved", icon: Bookmark },
]

const allTags = ["Vegan", "Gluten-Free", "High-Protein", "Low-Carb", "Quick Meal", "Keto"]

export function RecipesFeed() {
  const { savedRecipes, userRecipes, comments } = useNutrition()
  const [activeTab, setActiveTab] = useState("trending")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const sortedRecipes = React.useMemo(() => {
    const list = activeTab === "saved" ? savedRecipes : userRecipes
    
    switch (activeTab) {
      case "trending":
        return [...list].sort((a, b) => {
          const likesA = a.likes || 0
          const likesB = b.likes || 0
          const commentsA = comments.filter(c => c.recipeId === a.id.toString()).length
          const commentsB = comments.filter(c => c.recipeId === b.id.toString()).length
          return (likesB + commentsB) - (likesA + commentsA)
        })
      case "recent":
        return [...list].sort((a, b) => {
          const timeA = typeof a.id === "string" && a.id.startsWith("custom-") 
            ? parseInt(a.id.split("-")[1]) 
            : 0
          const timeB = typeof b.id === "string" && b.id.startsWith("custom-") 
            ? parseInt(b.id.split("-")[1]) 
            : 0
          return timeB - timeA
        })
      case "top-rated":
        return [...list].sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
      default:
        return list
    }
  }, [activeTab, savedRecipes, userRecipes, comments])

  const filteredRecipes = sortedRecipes.filter((recipe) => {
    if (selectedTags.length === 0) return true
    return selectedTags.some((tag: string) => recipe.tags && recipe.tags.includes(tag))
  })

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
            Healthy Recipes
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover and share nutritious recipes from the community
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full gap-2 shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Recipe</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sticky top-[65px] z-20 bg-background/80 backdrop-blur-md pt-2 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {filterTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="gap-2 shrink-0 h-9 px-4 rounded-full"
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground opacity-50">
            {activeTab === "saved" ? (
              <>
                <Bookmark className="w-10 h-10" />
                <p className="text-sm font-medium">No saved recipes yet</p>
              </>
            ) : (
              <>
                <Sparkles className="w-10 h-10" />
                <p className="text-sm font-medium">No recipes found. Upload one to get started!</p>
              </>
            )}
          </div>
        ) : (
          filteredRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe as any}
              priority={index < 4}
              onClick={() => setSelectedRecipe(recipe)}
              onCommentClick={() => setSelectedRecipe({ ...recipe, openAtComments: true })}
            />
          ))
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe as any}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {isAddModalOpen && (
        <AddRecipeModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  )
}
