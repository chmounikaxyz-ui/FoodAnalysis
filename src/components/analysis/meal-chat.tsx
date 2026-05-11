import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Send, Loader2, Camera, Image as ImageIcon, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { analyzeFoodImage, getNutritionChatResponse } from "@/lib/gemini"
import { useNutrition } from "@/lib/nutrition-context"
import { Check } from "lucide-react"

interface Message {
  id: string
  role: "user" | "model"
  content: string
  image?: string
  analysisData?: { info: any; image: string }
  isLogged?: boolean
}

const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "model",
  content:
    "Welcome to Nru AI Chat! Upload a photo of your meal and I'll break down the nutritional content, provide health scores, and give you personalized tips.",
}

export function MealChat() {
  const { addMeal } = useNutrition()
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const originalImageData = event.target?.result as string
        
        setIsLoading(true)
        // Add a temporary "Analyzing..." message
        const analysisId = Date.now().toString()
        const userMessage: Message = {
          id: analysisId,
          role: "user",
          content: "Analyzing this meal...",
          image: originalImageData,
        }
        setMessages((prev) => [...prev, userMessage])

        try {
          console.log("Starting image compression...");
          // Compress image for faster API response
          const imageData = await compressImage(originalImageData)
          console.log("Image compressed. Sending to Gemini...");
          
          const analysis = await analyzeFoodImage(imageData, 'image/jpeg')
          console.log("Analysis received:", analysis.foodName, "isFood:", analysis.isFood);

          if (!analysis.isFood) {
            const response: Message = {
              id: (Date.now() + 1).toString(),
              role: "model",
              content: `**Nru Health Check:** ${analysis.analysis}\n\nPlease upload a photo of your meal for a full nutritional breakdown.`,
              isLogged: false,
            }
            setMessages((prev) => {
              const filtered = prev.filter(m => m.id !== analysisId);
              return [...filtered, { ...userMessage, content: "Analyze this image" }, response];
            })
            return;
          }

          const response: Message = {
            id: (Date.now() + 1).toString(),
            role: "model",
            content: `Based on the meal analysis for **${analysis.foodName}**, here's your complete breakdown:

**Nutritional Summary:**
• **Calories:** ${analysis.calories} kcal
• **Protein:** ${analysis.protein}g
• **Carbs:** ${analysis.carbs}g
• **Fats:** ${analysis.fat}g
${analysis.fiber ? `• **Fiber:** ${analysis.fiber}g\n` : ""}${analysis.sugar ? `• **Sugar:** ${analysis.sugar}g\n` : ""}${analysis.estimatedWeight ? `• **Estimated Weight:** ${analysis.estimatedWeight}g\n` : ""}
**GatHealth Score:** ${analysis.healthScore}/100
**Glycemic Index:** ${analysis.glycemicIndex || "N/A"}

${analysis.vitamins && analysis.vitamins.length > 0 ? `**Key Nutrients:**\n${analysis.vitamins.map(v => `• ${v}`).join("\n")}\n\n` : ""}**AI Insight:**
${analysis.analysis}

**Health Tips:**
${analysis.healthTips?.map(tip => `• ${tip}`).join("\n")}`,
            isLogged: true,
            analysisData: { info: analysis, image: originalImageData },
          }
          
          // Automatically add meal to daily log only if it's food
          addMeal(analysis, originalImageData);
          
          setMessages((prev) => {
            const filtered = prev.filter(m => m.id !== analysisId);
            return [...filtered, { ...userMessage, content: `Analyze this ${analysis.foodName}` }, response];
          })

        } catch (error) {
           console.error("Meal analysis error:", error);
           setMessages((prev) => [...prev, { id: 'err', role: 'model', content: "Failed to analyze image. This can happen with very large images or poor lighting. Please try again with a clearer, smaller photo." }])
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsgContent = input
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsgContent,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Map history for Gemini
      const history = messages.map(m => ({ 
        role: m.role, 
        parts: m.content 
      }));
      
      const response = await getNutritionChatResponse(userMsgContent, history);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: response,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      setMessages((prev) => [...prev, { id: 'err', role: 'model', content: "Something went wrong." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col gap-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          {messages.length === 1 && (
            <div className="py-12 flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
                  <Camera className="w-10 h-10 text-primary relative z-10" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-foreground tracking-tight">How can I help today?</h2>
                 <p className="text-muted-foreground text-sm max-w-sm">
                   Snap a photo of your meal or ask a question about your nutrition.
                 </p>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Analyze Photo</p>
                      <p className="text-xs text-muted-foreground">Get instant macro breakdown</p>
                    </div>
                  </button>
                  <button 
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                    onClick={() => setInput("What should I eat for a high protein dinner?")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Meal Planning</p>
                      <p className="text-xs text-muted-foreground">Personalized lunch suggestions</p>
                    </div>
                  </button>
               </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex gap-3 max-w-[85%] lg:max-w-lg",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                {msg.role === "model" && (
                  <div className="flex items-end">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary-foreground uppercase">Nru</span>
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 break-words text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border border-border"
                  )}
                >
                  {msg.image && (
                    <div className="relative w-full aspect-video rounded-lg mb-3 overflow-hidden border border-white/20">
                      <img
                        src={msg.image}
                        alt="Uploaded meal"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.analysisData && !msg.isLogged && (
                    <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Action</p>
                       <Button 
                        size="sm" 
                        className="w-full gap-2 h-9 rounded-xl"
                        onClick={() => {
                          addMeal(msg.analysisData!.info, msg.analysisData!.image);
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isLogged: true } : m));
                        }}
                       >
                         <Upload className="w-3.5 h-3.5" />
                         Add to Daily Log
                       </Button>
                    </div>
                  )}
                  {msg.isLogged && (
                    <div className="mt-4 pt-4 border-t border-border">
                       <div className="flex items-center gap-2 text-primary font-medium text-xs">
                         <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                         </div>
                         Successfully logged to dashboard
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start max-w-2xl mx-auto w-full">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary-foreground uppercase">Nru</span>
                </div>
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-4 py-3 border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      <div className="border-t border-border bg-card p-4 lg:p-8">
        <div className="max-w-2xl mx-auto w-full">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 bg-secondary/50 border-0 hover:bg-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="sr-only">Upload meal photo</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about nutrition..."
              className="flex-1 bg-secondary border-0 h-10 focus-visible:ring-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
