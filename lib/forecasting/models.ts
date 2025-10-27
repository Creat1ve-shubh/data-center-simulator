export interface ForecastResult {
  timestamp: Date
  predicted: number
  lower80: number
  upper80: number
}

export function forecastSolar(historicalIrradiance: number[], hours = 24): ForecastResult[] {
  const lastDay = historicalIrradiance.slice(-24)
  const mean = lastDay.reduce((sum, v) => sum + v, 0) / 24
  const std = Math.sqrt(lastDay.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 24)

  const forecasts: ForecastResult[] = []
  const now = new Date()

  for (let h = 0; h < hours; h++) {
    const hourOfDay = (now.getHours() + h) % 24
    const predicted = lastDay[hourOfDay]

    forecasts.push({
      timestamp: new Date(now.getTime() + h * 3600000),
      predicted,
      lower80: Math.max(0, predicted - 1.28 * std),
      upper80: Math.min(1000, predicted + 1.28 * std),
    })
  }

  return forecasts
}

export function forecastWind(historicalSpeed: number[], hours = 24): ForecastResult[] {
  const lastDay = historicalSpeed.slice(-24)
  const mean = lastDay.reduce((sum, v) => sum + v, 0) / 24
  const std = Math.sqrt(lastDay.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 24)

  const forecasts: ForecastResult[] = []
  const now = new Date()

  for (let h = 0; h < hours; h++) {
    const hourOfDay = (now.getHours() + h) % 24
    const predicted = lastDay[hourOfDay]

    forecasts.push({
      timestamp: new Date(now.getTime() + h * 3600000),
      predicted,
      lower80: Math.max(0, predicted - 1.28 * std * 1.5),
      upper80: Math.min(20, predicted + 1.28 * std * 1.5),
    })
  }

  return forecasts
}
