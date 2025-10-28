"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface AutoPlanButtonProps {
  onPlanGenerated?: (plan: any) => void
}

export function AutoPlanButton({ onPlanGenerated }: AutoPlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAutoplan = async () => {
    setIsLoading(true)
    try {
      // Simulate auto-plan generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const plan = {
        recommendedMix: {
          solar: 45,
          wind: 35,
          hydro: 15,
          storage: 5,
        },
        estimatedCost: 2500000,
        paybackPeriod: 7.5,
        annualSavings: 350000,
        co2Reduction: 1200,
      }

      onPlanGenerated?.(plan)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleAutoplan} disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
      <Zap className="w-4 h-4 mr-2" />
      {isLoading ? "Generating Plan..." : "Auto Plan"}
    </Button>
  )
}
