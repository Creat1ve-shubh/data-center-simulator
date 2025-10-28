"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  Lightbulb,
  Map,
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  name: string;
  href: `/${string}` | "/";
  icon: LucideIcon; // ✅ Fixes Activity type issue
  description: string;
};

const navigation: NavigationItem[] = [
  {
    name: "Efficiency",
    href: "/efficiency",
    icon: BarChart3,
    description: "Energy efficiency optimization",
  },
  {
    name: "Roadmap",
    href: "/roadmap",
    icon: Map,
    description: "Renewable energy transition plan",
  },
  {
    name: "Telemetry",
    href: "/telemetry",
    icon: Activity,
    description: "Real-time monitoring",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Analytics and reports",
  },
  {
    name: "Case Studies",
    href: "/case-studies",
    icon: Lightbulb,
    description: "Real-world examples",
  },
  {
    name: "Documentation",
    href: "/docs",
    icon: BookOpen,
    description: "Technical documentation",
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-neutral-100">
                GreenCloud
              </span>
              <span className="text-xs text-neutral-400">
                Data Center Optimizer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex ml-10 space-x-1">
            {navigation.map(({ name, href, icon: Icon, description }) => {
              const isActive = pathname === href;

              return (
                <Link
                  key={name}
                  href={href}
                  title={description}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-2 h-4 w-4",
                      isActive
                        ? "text-white"
                        : "text-neutral-400 group-hover:text-neutral-200"
                    )}
                  />
                  {name}
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-neutral-300">System Online</span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-neutral-800 md:hidden px-2 pb-3 pt-2 space-y-1">
        {navigation.map(({ name, href, icon: Icon, description }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={name}
              href={href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-green-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-4 w-4",
                  isActive
                    ? "text-white"
                    : "text-neutral-400 group-hover:text-neutral-200"
                )}
              />
              <div>
                <div>{name}</div>
                <div className="text-xs text-neutral-400">{description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
