"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Zap, Table2, FileText, ChevronLeft } from "lucide-react"
import { useSimulatorStore } from "@/store/simulator-store"

export function MainNav() {
  const pathname = usePathname()
  const { leftOpen, setLeftOpen } = useSimulatorStore()

  const navItems = [
    { href: "/efficiency", label: "Efficiency", icon: BarChart3 },
    { href: "/roadmap", label: "Roadmap", icon: Zap },
    { href: "/telemetry", label: "Telemetry", icon: Table2 },
    { href: "/reports", label: "Reports", icon: FileText },
  ]

  return (
    <aside
      className={`${
        leftOpen ? "w-[280px]" : "w-0"
      } transition-all duration-200 overflow-hidden border-r border-neutral-800 bg-neutral-900 flex flex-col`}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold text-neutral-100">DC Simulator</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftOpen(false)}
          className="text-neutral-400 hover:text-neutral-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-2 ${
                  isActive
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800 text-xs text-neutral-500">
        <p>Data Center Energy Efficiency Simulator</p>
      </div>
    </aside>
  )
}
