import * as React from "react"
import { useState } from "react"
import { X, Plus, Trash2, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNutrition } from "@/lib/nutrition-context"
import { Recipe } from "@/types"
import { cn } from "@/lib/utils"

const AVAILABLE_TAGS = ["Vegan", "Gluten-Free", "High-Protein", "Low-Carb", "Quick Meal", "Keto"]

interface AddRecipeModalProps {
  onClose: () => void
}

export function AddRecipeModal({ onClose }: AddRecipeModalProps) {
  const { addUserRecipe, profile } = useNutrition()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prepTime: "",
    calories: 400,
    servings: 1,
    image: "",
    protein: 20,
    carbs: 40,
    fat: 10,
    fiber: 5,
  })

  const [ingredients, setIngredients] = useState([{ amount: "", name: "" }])
  const [steps, setSteps] = useState([{ title: "", description: "" }])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleAddIngredient = () => setIngredients([...ingredients, { amount: "", name: "" }])
  const handleRemoveIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index))
  const handleIngredientChange = (index: number, field: "amount" | "name", value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index][field] = value
    setIngredients(newIngredients)
  }

  const handleAddStep = () => setSteps([...steps, { title: "", description: "" }])
  const handleRemoveStep = (index: number) => setSteps(steps.filter((_, i) => i !== index))
  const handleStepChange = (index: number, field: "title" | "description", value: string) => {
    const newSteps = [...steps]
    newSteps[index][field] = value
    setSteps(newSteps)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setFormData(prev => ({ ...prev, image: event.target?.result as string }))
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newRecipe: Recipe = {
      id: "custom-" + Date.now().toString(),
      title: formData.title,
      description: formData.description,
      author: profile?.name || "Anonymous",
      authorInitials: (profile?.name || "Anonymous").split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2),
      image: formData.image || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
      calories: formData.calories,
      prepTime: formData.prepTime || "20 min",
      servings: formData.servings,
      healthScore: 85, // Default for custom
      nutrition: {
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fat,
        fiber: formData.fiber,
      },
      ingredients: ingredients.filter(i => i.name.trim() !== ""),
      steps: steps.filter(s => s.title.trim() !== ""),
      isCustom: true,
      tags: selectedTags.length > 0 ? selectedTags : ["My Recipe"],
      createdBy: profile?.email || "",
    }

    setTimeout(() => {
      addUserRecipe(newRecipe)
      setIsLoading(false)
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-center justify-between bg-card/95 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Upload Recipe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Share your healthy creations</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="recipe-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-1 h-5 bg-primary rounded-full" />
                 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
              </div>

              <div className="aspect-video relative rounded-2xl border-2 border-dashed border-border overflow-hidden group hover:border-primary/50 transition-colors">
                {formData.image ? (
                  <div className="relative w-full h-full">
                    <img src={formData.image} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Add Recipe Cover</span>
                    <span className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">Clear photos get more likes</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recipe Title</label>
                  <Input 
                    placeholder="e.g. Avocado Toast Deluxe" 
                    className="rounded-xl h-12 border-border focus:ring-primary/20"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Short Description</label>
                  <textarea 
                    placeholder="A brief overview of your delicious meal..." 
                    className="flex min-h-[100px] w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {[
                 { label: "Prep Time", value: formData.prepTime, field: "prepTime", placeholder: "15 min" },
                 { label: "Calories", value: formData.calories, field: "calories", type: "number" },
                 { label: "Servings", value: formData.servings, field: "servings", type: "number" },
                 { label: "Protein (g)", value: formData.protein, field: "protein", type: "number" },
               ].map((item) => (
                <div key={item.label} className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</label>
                    <Input 
                        placeholder={item.placeholder}
                        type={item.type || "text"}
                        className="rounded-xl border-border bg-secondary/20"
                        value={item.value}
                        onChange={e => setFormData(p => ({ ...p, [item.field]: item.type === "number" ? (parseInt(e.target.value) || 0) : e.target.value }))}
                    />
                </div>
               ))}
            </section>

            {/* Tags Selection */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Diet & Tag Categories</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ingredients */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ingredients</h3>
                 </div>
                 <Button type="button" variant="ghost" size="sm" onClick={handleAddIngredient} className="text-primary hover:text-primary/80 h-8 font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                 </Button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 group animate-in fade-in slide-in-from-right-2 duration-300">
                    <Input 
                        placeholder="Amount" 
                        className="w-24 rounded-xl border-border"
                        value={ing.amount}
                        onChange={e => handleIngredientChange(idx, "amount", e.target.value)}
                    />
                    <Input 
                        placeholder="Ingredient name" 
                        className="flex-1 rounded-xl border-border"
                        value={ing.name}
                        onChange={e => handleIngredientChange(idx, "name", e.target.value)}
                    />
                    {ingredients.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(idx)} className="rounded-xl text-muted-foreground hover:text-red-500 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Steps */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cooking Steps</h3>
                 </div>
                 <Button type="button" variant="ghost" size="sm" onClick={handleAddStep} className="text-primary hover:text-primary/80 h-8 font-bold">
                    <Plus className="w-4 h-4 mr-1" /> Add Step
                 </Button>
              </div>
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-secondary/20 border border-border/50 relative group animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black w-5 h-5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                            {idx + 1}
                        </span>
                        {steps.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(idx)} className="h-6 w-6 rounded-lg text-muted-foreground hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    <div className="space-y-3">
                        <Input 
                            placeholder="Step Title (e.g. Prepare the base)" 
                            className="rounded-xl border-border font-bold bg-card"
                            value={step.title}
                            onChange={e => handleStepChange(idx, "title", e.target.value)}
                        />
                        <textarea 
                            placeholder="Detailed instructions..." 
                            className="flex min-h-[80px] w-full rounded-xl border border-border bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all scrollbar-none"
                            value={step.description}
                            onChange={e => handleStepChange(idx, "description", e.target.value)}
                        />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-card/95 backdrop-blur-md sticky bottom-0 z-10 flex gap-4">
           <Button variant="outline" size="lg" onClick={onClose} className="flex-1 h-14 rounded-2xl font-bold">
             Cancel
           </Button>
           <Button 
            type="submit" 
            form="recipe-form" 
            size="lg" 
            className="flex-[1.5] h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
            disabled={isLoading || !formData.title}
           >
             {isLoading ? (
               <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing...</>
             ) : (
               "Publish Recipe"
             )}
           </Button>
        </div>
      </div>
    </div>
  )
}
