import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Bell, Search, Leaf, User, Settings, LogOut, CheckCircle, TrendingUp, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNutrition } from "@/lib/nutrition-context";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";

export function TopHeader() {
  const { profile, logout, notificationsRead, markNotificationsRead, notifications, clearNotifications } = useNutrition();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const formatNotificationTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  useEffect(() => {
    if (showNotifications) {
      markNotificationsRead();
    }
  }, [showNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccount(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="flex items-center gap-3 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">Nru</span>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowAccount(false);
              }}
            >
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              {!notificationsRead && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full animate-in fade-in zoom-in duration-300" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-bold">Notifications</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNotifications(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                        <p className="text-xs">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const Icon = n.type === "success" ? CheckCircle : n.type === "info" ? TrendingUp : Bell;
                        const color = n.type === "success" ? "text-green-500" : n.type === "info" ? "text-blue-500" : "text-amber-500";
                        
                        return (
                          <div key={n.id} className="p-4 flex gap-3 hover:bg-secondary/40 transition-colors cursor-pointer">
                            <div className={`mt-0.5 ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <p className="text-xs font-bold leading-none">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">{n.desc}</p>
                              <p className="text-[10px] text-muted-foreground/60">{formatNotificationTime(n.timestamp)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-[11px] font-bold text-primary"
                        onClick={() => clearNotifications()}
                      >
                        Clear all notifications
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account */}
          <div className="relative" ref={accountRef}>
            <Avatar 
              className="w-8 h-8 cursor-pointer ring-offset-2 ring-offset-background hover:ring-2 hover:ring-primary/20 transition-all"
              onClick={() => {
                setShowAccount(!showAccount);
                setShowNotifications(false);
              }}
            >
              {profile.photo ? (
                <img src={profile.photo} className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              )}
            </Avatar>

            <AnimatePresence>
              {showAccount && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-50 p-2"
                >
                  <div className="px-3 py-2 mb-2">
                    <p className="text-xs font-bold text-foreground">{profile.name}</p>
                    <p className="text-[10px] text-muted-foreground">Premium Member</p>
                  </div>
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 h-9 rounded-xl text-xs"
                      onClick={() => {
                        navigate("/profile");
                        setShowAccount(false);
                      }}
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile & Goals
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 h-9 rounded-xl text-xs"
                      onClick={() => {
                        navigate("/settings");
                        setShowAccount(false);
                      }}
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Settings
                    </Button>
                    <div className="h-px bg-border my-1 mx-2" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 h-9 rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-50/50"
                      onClick={() => {
                        console.log("Logout button clicked");
                        logout();
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
