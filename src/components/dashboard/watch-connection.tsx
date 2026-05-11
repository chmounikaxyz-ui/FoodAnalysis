import * as React from "react"
import { useNutrition } from "@/lib/nutrition-context"
import { Watch, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HealthConnectButton() {
  const { isWatchConnected, syncWithWatch, lastSync } = useNutrition()
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    try {
      await syncWithWatch()
    } catch (err: any) {
      if (err.message === "Not connected") {
        return // Context already handled setIsWatchConnected(false)
      }
      if (err.isApiDisabled) {
        setError(err.details || "Fitness API disabled. Please enable it in Google Cloud Console.")
      } else {
        setError(err.message || "Sync failed. Try reconnecting.")
      }
    } finally {
      setIsSyncing(false)
    }
  }

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        handleSync()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  if (isWatchConnected) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full gap-2 h-9 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600"
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Connected"}</span>
      </Button>
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
