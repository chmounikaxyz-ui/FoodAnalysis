import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Clock,
  Flame,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"

export interface RecipeCardProps {
  recipe: {
    id: string | number
    title: string
    author: string
    authorInitials: string
    image: string
    description: string
    healthScore: number
    calories: number
    prepTime: string
    likes: number
    comments: number
    tags: string[]
    verified: boolean
    isCustom?: boolean
    createdBy?: string
    nutrition?: any
    steps?: any
    ingredients?: any
  }
  priority?: boolean
  onClick?: () => void
  onCommentClick?: () => void
  key?: React.Key
}

export function RecipeCard({ recipe, priority = false, onClick, onCommentClick }: RecipeCardProps) {
  const [hasLiked, setHasLiked] = useState(false)
  const { savedRecipes, toggleSaveRecipe, comments, profile } = useNutrition()

  const isSaved = savedRecipes.some(r => r.id.toString() === recipe.id.toString())

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSaveRecipe({
      ...recipe,
      id: recipe.id.toString(),
      nutrition: recipe.nutrition || { protein: 0, carbs: 0, fat: 0, fiber: 0 },
      steps: recipe.steps || [],
      ingredients: recipe.ingredients || []
    })
  }

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHasLiked(!hasLiked)
  }

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCommentClick?.()
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  }

  const scoreBadge = {
    className:
      recipe.healthScore >= 90
        ? "bg-primary/10 text-primary border-primary/20"
        : recipe.healthScore >= 80
          ? "bg-accent/10 text-accent-foreground border-accent/20"
          : "bg-muted text-muted-foreground border-border",
  }

  return (
    <article
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.() }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-2 right-2">
          {recipe.isCustom && (
            recipe.createdBy?.toLowerCase() === profile?.email?.toLowerCase() ? (
              <Badge className="bg-orange-500 text-white border-0 text-[10px] font-bold h-5 shadow-sm px-1.5 uppercase tracking-wider">
                My Recipe
              </Badge>
            ) : (
              <Badge className="bg-blue-500 text-white border-0 text-[10px] font-bold h-5 shadow-sm px-1.5 uppercase tracking-wider">
                Community
              </Badge>
            )
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <Badge variant="outline" className={cn("border backdrop-blur-md text-[10px] font-bold tracking-tight", scoreBadge.className)}>
            AI Score: {recipe.healthScore || 0}
          </Badge>
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-sm text-foreground line-clamp-1 tracking-tight">
            {recipe.title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-normal">
            {recipe.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold uppercase">
                {recipe.authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] font-bold text-foreground leading-none">{recipe.author}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTime}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                  <Flame className="w-3 h-3" />
                  {recipe.calories}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 group/btn cursor-pointer" onClick={handleToggleLike}>
              <Flame className={cn("w-4 h-4 transition-all", hasLiked ? "fill-current text-orange-500 scale-110" : "text-muted-foreground group-hover/btn:text-foreground")} />
            </div>
            <div className="flex items-center gap-1 cursor-pointer group/btn" onClick={handleCommentClick}>
              <MessageCircle className="w-4 h-4 text-muted-foreground group-hover/btn:text-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Bookmark 
              className={cn(
                "w-4 h-4 transition-all cursor-pointer hover:scale-110", 
                isSaved ? "fill-current text-primary" : "text-muted-foreground hover:text-foreground"
              )} 
              onClick={handleToggleSave}
            />
            <Share2 
                className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer active:scale-90 transition-transform" 
                onClick={handleShare}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {recipe.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[9px] py-0 px-2 font-bold uppercase tracking-wider h-5 rounded-full">
              {tag}
            </Badge>
          ))}
          {recipe.tags.length > 2 && (
            <Badge variant="secondary" className="text-[9px] py-0 px-2 font-bold h-5 rounded-full">
              +{recipe.tags.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </article>
  )
}
