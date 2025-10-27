"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/efficiency", label: "Efficiency" },
  { href: "/efficiency/auto-plan", label: "Auto-Plan" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/docs", label: "Documentation" },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-green-600">
              GreenCloud
            </Link>
            <div className="flex gap-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-green-600",
                    pathname === item.href ? "text-green-600" : "text-gray-600",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <a
            href="https://github.com/yourusername/greencloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}
