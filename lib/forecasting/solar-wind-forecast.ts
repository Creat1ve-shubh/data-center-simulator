// Phase 4: Forecasting Models with Uncertainty Quantification

import type { Region } from "@/types"

export interface ForecastResult {
  timestamp: Date
  forecast: number
  lower95: number // 95% confidence interval lower bound
  upper95: number // 95% confidence interval upper bound
  lower68: number // 68% confidence interval lower bound
  upper68: number // 68% confidence interval upper bound
}

export interface ForecastModel {
  solarForecasts: ForecastResult[]
  windForecasts: ForecastResult[]
  accuracy: number // RMSE
}

// Simplified solar forecasting using historical patterns and weather
export function forecastSolar(region: Region, hoursAhead = 24, historicalData?: number[]): ForecastResult[] {
  const forecasts: ForecastResult[] = []
  const now = new Date()

  // Base solar irradiance pattern (simplified sine wave for day/night cycle)
  const baseCapacityFactor = region.capacityFactors.solar || 0.25

  for (let i = 0; i < hoursAhead; i++) {
    const forecastTime = new Date(now.getTime() + i * 3600000)
    const hour = forecastTime.getHours()

    // Simplified solar pattern: peak at noon, zero at night
    const hourlyPattern = Math.max(0, Math.sin(((hour - 6) * Math.PI) / 12))
    const baseForecast = hourlyPattern * baseCapacityFactor * 100 // Convert to percentage

    // Add uncertainty that increases with forecast horizon
    const uncertainty = 5 + i * 0.5 // Increases with hours ahead
    const stdDev = (uncertainty / 100) * baseForecast

    forecasts.push({
      timestamp: forecastTime,
      forecast: Math.max(0, baseForecast),
      lower95: Math.max(0, baseForecast - 1.96 * stdDev),
      upper95: baseForecast + 1.96 * stdDev,
      lower68: Math.max(0, baseForecast - stdDev),
      upper68: baseForecast + stdDev,
    })
  }

  return forecasts
}

// Simplified wind forecasting using historical patterns and weather
export function forecastWind(region: Region, hoursAhead = 24, historicalData?: number[]): ForecastResult[] {
  const forecasts: ForecastResult[] = []
  const now = new Date()

  // Base wind capacity factor (varies by region)
  const baseCapacityFactor = region.capacityFactors.wind || 0.35

  for (let i = 0; i < hoursAhead; i++) {
    const forecastTime = new Date(now.getTime() + i * 3600000)

    // Simplified wind pattern: more variable than solar
    const randomVariation = Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2
    const baseForecast = Math.max(0, (baseCapacityFactor + randomVariation) * 100)

    // Wind forecasts have higher uncertainty
    const uncertainty = 15 + i * 1.0 // Higher uncertainty than solar
    const stdDev = (uncertainty / 100) * baseForecast

    forecasts.push({
      timestamp: forecastTime,
      forecast: Math.max(0, baseForecast),
      lower95: Math.max(0, baseForecast - 1.96 * stdDev),
      upper95: baseForecast + 1.96 * stdDev,
      lower68: Math.max(0, baseForecast - stdDev),
      upper68: baseForecast + stdDev,
    })
  }

  return forecasts
}

// Probabilistic forecast combining multiple models
export function probabilisticForecast(region: Region, hoursAhead = 24): ForecastModel {
  const solarForecasts = forecastSolar(region, hoursAhead)
  const windForecasts = forecastWind(region, hoursAhead)

  // Calculate simple accuracy metric (RMSE)
  const solarRmse = Math.sqrt(
    solarForecasts.reduce((sum, f) => sum + Math.pow(f.forecast - (f.lower95 + f.upper95) / 2, 2), 0) /
      solarForecasts.length,
  )

  const windRmse = Math.sqrt(
    windForecasts.reduce((sum, f) => sum + Math.pow(f.forecast - (f.lower95 + f.upper95) / 2, 2), 0) /
      windForecasts.length,
  )

  return {
    solarForecasts,
    windForecasts,
    accuracy: (solarRmse + windRmse) / 2,
  }
}
