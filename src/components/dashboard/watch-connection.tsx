import * as React from "react"
import { useNutrition } from "@/lib/nutrition-context"
import { Watch, RefreshCw, CheckCircle2, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HealthConnectButton() {
  const { isWatchConnected, syncWithWatch, lastSync, setIsWatchConnected } = useNutrition()
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleConnect = async () => {
    try {
      setError(null)
      const response = await fetch("/api/auth/url")
      if (!response.ok) throw new Error("Could not get auth URL")
      const { url } = await response.json()
      const authWindow = window.open(url, "fitbit_oauth", "width=600,height=800")
      if (!authWindow) {
        setError("Popup blocked. Please allow popups.")
        return
      }
    } catch (err) {
      setError("Failed to start connection")
    }
  }

  const handleSync = React.useCallback(async () => {
    setIsSyncing(true)
    setError(null)
    setShowMenu(false)
    try {
      await syncWithWatch()
    } catch (err: any) {
      if (err.message === "Not connected") return
      if (err.isApiDisabled) {
        setError(err.details || "Fitness API disabled. Please enable it in Google Cloud Console.")
      } else {
        setError(err.message || "Sync failed. Try reconnecting.")
      }
    } finally {
      setIsSyncing(false)
    }
  }, [syncWithWatch])

  const handleDisconnect = async () => {
    setShowMenu(false)
    try {
      await fetch("/api/watch/disconnect", { method: "POST" })
      setIsWatchConnected(false)
    } catch (err) {
      setError("Failed to disconnect")
    }
  }

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        handleSync()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [handleSync])

  if (isWatchConnected) {
    return (
      <div className="relative" ref={menuRef}>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2 h-9 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
          onClick={() => setShowMenu(v => !v)}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Connected"}</span>
        </Button>

        {showMenu && (
          <div className="absolute top-full mt-2 right-0 z-50 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={handleSync}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              Sync Now
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <WifiOff className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        )}

        {error && (
          <div className="absolute top-full mt-2 right-0 z-50 w-64 p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600 shadow-xl">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full gap-2 h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
        onClick={handleConnect}
      >
        <Watch className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect Smart Watch</span>
      </Button>
      {error && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600 shadow-xl">
          {error}
        </div>
      )}
    </div>
  )
}
