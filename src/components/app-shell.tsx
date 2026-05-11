import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { TopHeader } from "@/components/top-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopHeader />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
