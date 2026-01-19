"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  Terminal,
  Sparkles,
  Map,
  Lightbulb,
  FileText,
  Brain,
  Wrench,
  GitBranch,
  CircleDot,
  GitPullRequest,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  shortcut: string;
}

const navItems: NavItem[] = [
  { label: "Kanban Board", href: "/dashboard/kanban", icon: LayoutGrid, shortcut: "K" },
  { label: "Agent Terminals", href: "/dashboard/terminals", icon: Terminal, shortcut: "A" },
  { label: "Insights", href: "/dashboard/insights", icon: Sparkles, shortcut: "N" },
  { label: "Roadmap", href: "/dashboard/roadmap", icon: Map, shortcut: "D" },
  { label: "Ideation", href: "/dashboard/ideation", icon: Lightbulb, shortcut: "I" },
  { label: "Changelog", href: "/dashboard/changelog", icon: FileText, shortcut: "L" },
  { label: "Context", href: "/dashboard/context", icon: Brain, shortcut: "C" },
  { label: "MCP Overview", href: "/dashboard/mcp", icon: Wrench, shortcut: "M" },
  { label: "Worktrees", href: "/dashboard/worktrees", icon: GitBranch, shortcut: "W" },
  { label: "GitHub Issues", href: "/dashboard/github/issues", icon: CircleDot, shortcut: "G" },
  { label: "GitHub PRs", href: "/dashboard/github/prs", icon: GitPullRequest, shortcut: "P" },
];

interface SidebarProps {
  className?: string;
}

function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  // TODO: Add mobile collapse functionality with setIsCollapsed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* App Branding */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              Auto Claude
            </h1>
          </Link>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {/* Project Section */}
        {!isCollapsed && (
          <div className="mb-2 px-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project
            </h2>
          </div>
        )}

        {/* Navigation Items */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive && [
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                    "shadow-[0_0_12px_rgba(139,92,246,0.15)]",
                    "before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-sidebar-primary",
                  ],
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 px-1.5 text-[10px] font-mono transition-all",
                        "border-sidebar-border bg-sidebar text-sidebar-foreground/60",
                        "group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground/80",
                        isActive && "border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary"
                      )}
                    >
                      {item.shortcut}
                    </Badge>
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        <div className="py-2">
          <Separator className="bg-sidebar-border" />
        </div>

        {/* Claude Code Link - Highlighted */}
        <Link
          href="https://claude.ai/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
            "bg-gradient-to-r from-sidebar-primary/10 to-transparent",
            "hover:from-sidebar-primary/20 hover:to-transparent",
            "border border-sidebar-primary/20 hover:border-sidebar-primary/30",
            "shadow-[0_0_12px_rgba(139,92,246,0.1)] hover:shadow-[0_0_16px_rgba(139,92,246,0.2)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            isCollapsed && "justify-center px-2 border-none from-transparent"
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4 shrink-0 text-sidebar-primary transition-all",
              "group-hover:scale-110 group-hover:rotate-12"
            )}
          />
          {!isCollapsed && (
            <span className="flex-1 text-sidebar-primary">Claude Code</span>
          )}
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            pathname === "/dashboard/settings" && "bg-sidebar-accent text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 shrink-0 text-sidebar-foreground/70 transition-transform",
              "group-hover:rotate-90"
            )}
          />
          {!isCollapsed && <span className="flex-1">Settings</span>}
        </Link>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "w-full gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-slate-900",
            isCollapsed && "px-2"
          )}
          size={isCollapsed ? "icon" : "default"}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="font-medium">Log Out</span>}
        </Button>
      </div>
    </aside>
  );
}

export { Sidebar };
export default Sidebar;
