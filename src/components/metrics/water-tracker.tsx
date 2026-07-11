import * as React from "react"
import { Bell, BellOff, Plus, Trash2, Clock, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNutrition } from "@/lib/nutrition-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Alarm {
  id: string
  time: string       // "HH:MM" 24h format
  label: string
  amount: number     // ml per reminder
  enabled: boolean
}

// Water drop tone via Web Audio API
function playWaterSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (e) {
    // Audio not available
  }
}

const APP_NAME = "NutriSnap"
const APP_ICON = "/icon-192.svg"

// Fire notification via Service Worker (supports action buttons)
async function fireSwNotification(alarm: Alarm) {
  if (!("serviceWorker" in navigator)) return false
  const reg = await navigator.serviceWorker.ready
  if (!reg.showNotification) return false

  await reg.showNotification("NutriSnap — Water Reminder", {
    body: `💧 ${alarm.label}\nTime to drink ${alarm.amount}ml of water!`,
    icon: APP_ICON,
    badge: APP_ICON,
    tag: `water-${alarm.id}`,
    renotify: true,
    requireInteraction: true,
    data: { amount: alarm.amount, alarmId: alarm.id },
    actions: [
      { action: "drink", title: "✓ Yes, I drank it" },
      { action: "skip",  title: "✗ Skip" },
    ],
  } as any)
  return true
}

export function WaterTracker() {
  const { hydration, addHydration, dailyGoal } = useNutrition()

  const [alarms, setAlarms] = React.useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem("nru_water_alarms")
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [showAddAlarm, setShowAddAlarm] = React.useState(false)
  const [newHour, setNewHour] = React.useState("8")
  const [newMinute, setNewMinute] = React.useState("00")
  const [newAmPm, setNewAmPm] = React.useState<"AM" | "PM">("AM")
  const [newLabel, setNewLabel] = React.useState("Drink water")
  const [newAmount, setNewAmount] = React.useState(250)

  // Convert 12hr inputs → "HH:MM" 24hr for internal storage
  const buildTime24 = (hour: string, minute: string, ampm: "AM" | "PM") => {
    let h = parseInt(hour, 10)
    if (ampm === "AM" && h === 12) h = 0
    if (ampm === "PM" && h !== 12) h += 12
    return `${String(h).padStart(2, "0")}:${minute}`
  }

  // In-app fallback prompt (shown if SW not available or user is in the app)
  const [pendingAlarm, setPendingAlarm] = React.useState<Alarm | null>(null)
  const [customMl, setCustomMl] = React.useState("")

  // Persist alarms
  React.useEffect(() => {
    localStorage.setItem("nru_water_alarms", JSON.stringify(alarms))
  }, [alarms])

  // ── Listen for SW → app messages (user tapped "Yes, I drank it") ───────────
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "WATER_LOGGED") {
        const amount = event.data.amount || 250
        addHydration(amount)
        playWaterSound()
        // Dismiss in-app prompt if it matches
        setPendingAlarm((prev) =>
          prev?.id === event.data.alarmId ? null : prev
        )
      }
    }

    navigator.serviceWorker.addEventListener("message", handler)
    return () => navigator.serviceWorker.removeEventListener("message", handler)
  }, [addHydration])

  // ── Alarm scheduler ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const checkAlarms = async () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

      for (const alarm of alarms) {
        if (!alarm.enabled || alarm.time !== currentTime) continue

        const lastFiredKey = `nru_alarm_fired_${alarm.id}_${now.toDateString()}`
        if (localStorage.getItem(lastFiredKey)) continue
        localStorage.setItem(lastFiredKey, "1")

        playWaterSound()

        if (Notification.permission === "granted") {
          // Try SW notification (has action buttons + app icon)
          const swFired = await fireSwNotification(alarm)

          // Fallback: plain notification if SW not ready
          if (!swFired) {
            new Notification("NutriSnap — Water Reminder", {
              body: `💧 ${alarm.label} — ${alarm.amount}ml`,
              icon: APP_ICON,
              tag: `water-${alarm.id}`,
            })
          }
        }

        // Always show in-app prompt too (user may have app open)
        setPendingAlarm(alarm)
        setCustomMl(String(alarm.amount))
      }
    }

    const interval = setInterval(checkAlarms, 60000)
    checkAlarms()
    return () => clearInterval(interval)
  }, [alarms])

  const requestPermission = async () => {
    if (!("Notification" in window)) return
    if (Notification.permission !== "granted") {
      await Notification.requestPermission()
    }
    // Also register SW
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js")
    }
  }

  // ── In-app prompt handlers ─────────────────────────────────────────────────
  const handleCompleted = () => {
    const ml = Number(customMl)
    if (ml > 0) addHydration(ml)
    playWaterSound()
    setPendingAlarm(null)
    setCustomMl("")
  }

  const handleSkipped = () => {
    setPendingAlarm(null)
    setCustomMl("")
  }

  // ── Alarm CRUD ─────────────────────────────────────────────────────────────
  const addAlarm = () => {
    const time24 = buildTime24(newHour, newMinute, newAmPm)
    const alarm: Alarm = {
      id: Date.now().toString(),
      time: time24,
      label: newLabel || "Drink water",
      amount: newAmount || 250,
      enabled: true,
    }
    setAlarms((prev) => [...prev, alarm].sort((a, b) => a.time.localeCompare(b.time)))
    setShowAddAlarm(false)
    setNewHour("8")
    setNewMinute("00")
    setNewAmPm("AM")
    setNewLabel("Drink water")
    setNewAmount(250)
    requestPermission()
  }

  const toggleAlarm = (id: string) =>
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))

  const deleteAlarm = (id: string) =>
    setAlarms((prev) => prev.filter((a) => a.id !== id))

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 lg:p-6 flex flex-col gap-6">

      {/* In-app alarm prompt (fallback / when app is open) */}
      {pendingAlarm && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-bold text-foreground">{pendingAlarm.label}</p>
            <span className="ml-auto text-[10px] text-muted-foreground">{formatTime(pendingAlarm.time)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Did you drink your water? Adjust the amount if needed:</p>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              className="h-8 text-sm bg-background w-28"
              min={0}
              max={2000}
            />
            <span className="text-xs text-muted-foreground">ml</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={handleCompleted}>
              <Check className="w-3 h-3" />
              Yes, I drank it
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={handleSkipped}>
              <X className="w-3 h-3" />
              Skip
            </Button>
          </div>
        </div>
      )}

      {/* Alarms section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            Water Reminders
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 rounded-full"
            onClick={() => setShowAddAlarm((v) => !v)}>
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {/* Add alarm form */}
        {showAddAlarm && (
          <div className="p-4 rounded-xl bg-secondary/40 border border-border flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {/* 12hr time picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time</label>
                <div className="flex gap-1 items-center">
                  {/* Hour */}
                  <select
                    value={newHour}
                    onChange={(e) => setNewHour(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-12"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={String(h)}>{h}</option>
                    ))}
                  </select>
                  <span className="text-sm font-bold text-muted-foreground">:</span>
                  {/* Minute */}
                  <select
                    value={newMinute}
                    onChange={(e) => setNewMinute(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-14"
                  >
                    {["00","05","10","15","20","25","30","35","40","45","50","55"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {/* AM/PM */}
                  <select
                    value={newAmPm}
                    onChange={(e) => setNewAmPm(e.target.value as "AM" | "PM")}
                    className="h-8 rounded-md border border-input bg-background px-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-16"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount (ml)</label>
                <Input type="number" value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="h-8 text-sm bg-background" min={50} max={1000} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Label</label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Morning hydration" className="h-8 text-sm bg-background" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={addAlarm}>
                <Check className="w-3 h-3" /> Save Reminder
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowAddAlarm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Alarm list */}
        {alarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center opacity-40">
            <BellOff className="w-8 h-8" />
            <p className="text-xs font-medium">No reminders set</p>
            <p className="text-[10px] text-muted-foreground">Add a reminder to get notified when it's time to drink water</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {alarms.map((alarm) => (
              <div key={alarm.id} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                alarm.enabled ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border opacity-60"
              )}>
                <Clock className={cn("w-4 h-4 shrink-0", alarm.enabled ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{formatTime(alarm.time)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{alarm.label} · {alarm.amount}ml</p>
                </div>
                <button onClick={() => toggleAlarm(alarm.id)}
                  className={cn("w-9 h-5 rounded-full flex items-center px-0.5 transition-colors border shrink-0",
                    alarm.enabled ? "bg-primary border-primary" : "bg-secondary border-border")}>
                  <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                    alarm.enabled ? "translate-x-4" : "translate-x-0")} />
                </button>
                <button onClick={() => deleteAlarm(alarm.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {alarms.some((a) => a.enabled) && Notification.permission !== "granted" && (
          <button onClick={requestPermission}
            className="text-[10px] text-primary underline underline-offset-2 text-center">
            Enable browser notifications to receive reminders
          </button>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Action buttons in notifications work in Chrome & Edge on desktop
        </p>
      </div>
    </div>
  )
}
