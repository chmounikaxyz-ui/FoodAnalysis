import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Camera, Zap, Shield, ChevronRight, Mail, Lock, ArrowLeft, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LandingPage({ onGetStarted }: { onGetStarted: (userData: { name: string; email: string }) => void }) {
  const [authMode, setAuthMode] = React.useState<"landing" | "login" | "signup">("landing");
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (authMode === "signup") {
      if (formData.name.trim().length < 2) { setError("Please enter your full name."); return; }
      if (formData.password.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
    }
    if (authMode === "login" && formData.password.length < 1) {
      setError("Please enter your password."); return;
    }

    setIsLoading(true);
    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = authMode === "signup"
        ? { name: formData.name.trim(), email: formData.email.trim(), password: formData.password }
        : { email: formData.email.trim(), password: formData.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      onGetStarted({ name: data.name, email: data.email });
    } catch (err) {
      setError("Network error. Make sure the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setError("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {authMode === "landing" ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl w-full text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                <Leaf className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                Nutrition Tracking <br /><span className="text-primary">Redefined.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Analyze your meals with AI, sync your smart watch, and hit your health goals with Nru.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={() => setAuthMode("signup")}
                className="rounded-full px-8 h-12 text-base font-bold gap-2 shadow-lg shadow-primary/20"
              >
                Sign Up Now
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setAuthMode("login")}
                className="rounded-full px-8 h-12 text-base font-bold bg-white"
              >
                Log In
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white p-8 rounded-[40px] border border-slate-200 shadow-2xl space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {authMode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-slate-500 text-sm">
                {authMode === "login" 
                  ? "Enter your credentials to continue" 
                  : "Start your health journey with Nru"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your Name"
                      className="h-12 pl-11 rounded-2xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com"
                    className="h-12 pl-11 rounded-2xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    required
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Min. 6 characters"
                    className="h-12 pl-11 rounded-2xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                  />
                </div>
              </div>

              {authMode === "signup" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        required
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Re-enter password"
                        className="h-12 pl-11 rounded-2xl bg-slate-50 border-slate-200 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pl-1 pt-1">
                    <input type="checkbox" id="terms" className="rounded border-slate-300 text-primary focus:ring-primary/20" required />
                    <label htmlFor="terms" className="text-xs text-slate-500">
                      I agree to the <span className="text-primary font-semibold cursor-pointer">Terms & Conditions</span>
                    </label>
                  </div>
                </>
              )}

              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
              >
                {isLoading ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setAuthMode("landing"); setError("") }}
                className="text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <div className="h-4 w-[1px] bg-slate-200 mx-2" />
              <Button 
                variant="link" 
                size="sm"
                onClick={() => switchMode(authMode === "login" ? "signup" : "login")}
                className="text-primary font-bold"
              >
                {authMode === "login" ? "Need an account?" : "Already have one?"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <footer className="mt-20 text-slate-400 text-sm">
        © 2026 Nru Health. Built with precision.
      </footer>
    </div>
  );
}
