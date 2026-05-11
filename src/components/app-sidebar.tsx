import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  ChefHat,
  BarChart3,
  Leaf,
  Settings,
  User,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "AI Chat", href: "/analysis", icon: MessageSquare },
  { label: "Recipes", href: "/recipes", icon: ChefHat },
  { label: "Metrics", href: "/metrics", icon: BarChart3 },
];

const bottomItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">
          Nru
        </span>
      </div>

      <nav className="flex-1 flex flex-col px-3 py-4 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 flex flex-col gap-1 border-t border-border pt-3">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
