import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Camera, Sparkles, Check, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { clarifyFoodImage, analyzeFoodImage, getNutritionChatResponse } from "@/lib/gemini"
import { useNutrition } from "@/lib/nutrition-context"

interface Message {
  id: string
  role: "user" | "model"
  content: string
  image?: string
  analysisData?: { info: any; image: string }
  isLogged?: boolean
  // Clarification state
  isClarifyPrompt?: boolean
  clarifyImage?: string        // compressed image for final analysis
  clarifyOriginal?: string     // original image for display
  clarifyFoodName?: string
  clarifyQuestions?: string[]
  clarifyAnswers?: string      // user's answers submitted
  clarifyDone?: boolean        // true once answered and analyzing
}

const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "model",
  content: "Welcome to Nru AI Chat! Upload a photo of your meal and I'll ask a few quick questions to give you the most accurate nutritional breakdown.",
}

export function MealChat() {
  const { addMeal } = useNutrition()
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Per-clarify-prompt answer state (keyed by message id)
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 800
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
    })
  }

  // ── Step 1: Upload → clarify questions ──────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // reset so same file can be re-uploaded
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const original = event.target?.result as string
      const uploadMsgId = Date.now().toString()

      setMessages(prev => [...prev, {
        id: uploadMsgId,
        role: "user",
        content: "Identifying this meal...",
        image: original,
      }])
      setIsLoading(true)

      try {
        const compressed = await compressImage(original)
        const clarify = await clarifyFoodImage(compressed, "image/jpeg")

        if (!clarify.isFood) {
          setMessages(prev => [
            ...prev.filter(m => m.id !== uploadMsgId),
            { id: uploadMsgId, role: "user", content: "Analyze this image", image: original },
            { id: Date.now().toString(), role: "model", content: `That doesn't look like food to me. Please upload a photo of a meal or dish for nutritional analysis.` }
          ])
          return
        }

        // Replace the "Identifying..." message and add clarify prompt
        setMessages(prev => [
          ...prev.filter(m => m.id !== uploadMsgId),
          { id: uploadMsgId, role: "user", content: `Uploaded ${clarify.foodName}`, image: original },
          {
            id: `clarify-${Date.now()}`,
            role: "model",
            content: `I can see **${clarify.foodName}**! To give you the most accurate nutritional breakdown, I have a few quick questions:`,
            isClarifyPrompt: true,
            clarifyImage: compressed,
            clarifyOriginal: original,
            clarifyFoodName: clarify.foodName,
            clarifyQuestions: clarify.questions,
            clarifyDone: false,
          }
        ])
      } catch (err: any) {
        setMessages(prev => [
          ...prev.filter(m => m.id !== uploadMsgId),
          { id: uploadMsgId, role: "user", content: "Analyze this image", image: original },
          { id: Date.now().toString(), role: "model", content: `Failed to identify food: ${err.message}` }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // ── Step 2: User submits answers → full analysis ─────────────────────────────
  const handleSubmitAnswers = async (msgId: string, msg: Message) => {
    const answers = pendingAnswers[msgId] || ""
    if (!answers.trim()) return

    // Mark clarify prompt as done so it hides the form
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, clarifyDone: true, clarifyAnswers: answers } : m
    ))
    setPendingAnswers(prev => { const n = { ...prev }; delete n[msgId]; return n })
    setIsLoading(true)

    try {
      const userAnswersText = (msg.clarifyQuestions || [])
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n") + `\n\nUser's answers: ${answers}`

      const analysis = await analyzeFoodImage(msg.clarifyImage!, "image/jpeg", userAnswersText)
      addMeal(analysis, msg.clarifyOriginal)

      setMessages(prev => [...prev,
        { id: Date.now().toString(), role: "user", content: answers },
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          isLogged: true,
          analysisData: { info: analysis, image: msg.clarifyOriginal! },
          content: `Here's the accurate breakdown for **${analysis.foodName}**:

**Nutritional Summary:**
• **Calories:** ${analysis.calories} kcal
• **Protein:** ${analysis.protein}g
• **Carbs:** ${analysis.carbs}g
• **Fats:** ${analysis.fat}g
${analysis.fiber ? `• **Fiber:** ${analysis.fiber}g\n` : ""}${analysis.sugar ? `• **Sugar:** ${analysis.sugar}g\n` : ""}${analysis.estimatedWeight ? `• **Estimated Weight:** ${analysis.estimatedWeight}g\n` : ""}
**Health Score:** ${analysis.healthScore}/100
**Glycemic Index:** ${analysis.glycemicIndex || "N/A"}

${analysis.vitamins?.length ? `**Key Nutrients:**\n${analysis.vitamins.map(v => `• ${v}`).join("\n")}\n\n` : ""}**AI Insight:**
${analysis.analysis}

**Health Tips:**
${analysis.healthTips?.map(tip => `• ${tip}`).join("\n")}`,
        }
      ])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "model",
        content: `Analysis failed: ${err.message}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Regular chat ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = input
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: userMsg }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, parts: m.content }))
      const response = await getNutritionChatResponse(userMsg, history)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "model", content: response }])
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", content: `Error: ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col gap-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">

          {/* Empty state */}
          {messages.length === 1 && (
            <div className="py-12 flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
                <Camera className="w-10 h-10 text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">How can I help today?</h2>
                <p className="text-muted-foreground text-sm max-w-sm">Snap a photo of your meal or ask a nutrition question.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Analyze Photo</p>
                    <p className="text-xs text-muted-foreground">Get accurate macro breakdown</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                  onClick={() => setInput("What should I eat for a high protein dinner?")}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Meal Planning</p>
                    <p className="text-xs text-muted-foreground">Personalized suggestions</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("flex gap-3 max-w-[85%] lg:max-w-lg", msg.role === "user" && "flex-row-reverse")}>
                {msg.role === "model" && (
                  <div className="flex items-end">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary-foreground uppercase">Nru</span>
                    </div>
                  </div>
                )}
                <div className={cn(
                  "rounded-2xl px-4 py-3 break-words text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none border border-border"
                )}>
                  {msg.image && (
                    <div className="relative w-full aspect-video rounded-lg mb-3 overflow-hidden border border-white/20">
                      <img src={msg.image} alt="Uploaded meal" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Clarify questions form */}
                  {msg.isClarifyPrompt && !msg.clarifyDone && (
                    <div className="mt-4 flex flex-col gap-3">
                      <ol className="flex flex-col gap-2">
                        {msg.clarifyQuestions?.map((q, i) => (
                          <li key={i} className="text-sm text-foreground font-medium">
                            {i + 1}. {q}
                          </li>
                        ))}
                      </ol>
                      <textarea
                        value={pendingAnswers[msg.id] || ""}
                        onChange={(e) => setPendingAnswers(prev => ({ ...prev, [msg.id]: e.target.value }))}
                        placeholder="Type your answers here... (e.g. 1. Fried in 2 tbsp oil  2. Added extra cheese)"
                        rows={3}
                        className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <Button
                        size="sm"
                        className="w-full gap-2 h-9 rounded-xl"
                        disabled={isLoading || !pendingAnswers[msg.id]?.trim()}
                        onClick={() => handleSubmitAnswers(msg.id, msg)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Analyze Now
                      </Button>
                    </div>
                  )}

                  {msg.isClarifyPrompt && msg.clarifyDone && (
                    <p className="mt-2 text-xs text-muted-foreground italic">✓ Analyzing with your details...</p>
                  )}

                  {/* Log to dashboard */}
                  {msg.analysisData && !msg.isLogged && (
                    <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Action</p>
                      <Button size="sm" className="w-full gap-2 h-9 rounded-xl"
                        onClick={() => {
                          addMeal(msg.analysisData!.info, msg.analysisData!.image)
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isLogged: true } : m))
                        }}>
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

      {/* Input bar */}
      <div className="border-t border-border bg-card p-4 lg:p-8">
        <div className="max-w-2xl mx-auto w-full">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Button type="button" variant="outline" size="icon"
              className="h-10 w-10 shrink-0 bg-secondary/50 border-0 hover:bg-secondary"
              onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="sr-only">Upload meal photo</span>
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <Input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about nutrition..."
              className="flex-1 bg-secondary border-0 h-10 focus-visible:ring-primary"
              disabled={isLoading} />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0"
              disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
