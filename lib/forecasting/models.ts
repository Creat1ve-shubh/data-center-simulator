/**
 * Forecasting Models
 * Predictive analytics for energy consumption, costs, and carbon emissions
 */

export interface ForecastInput {
  historicalData: {
    timestamp: Date;
    energy: number; // kWh
    cost: number; // USD
    carbon: number; // kg CO2
  }[];
  horizon: number; // months
  seasonality?: boolean;
}

export interface ForecastResult {
  predictions: {
    month: string;
    energy: number;
    energyLower: number;
    energyUpper: number;
    cost: number;
    costLower: number;
    costUpper: number;
    carbon: number;
    carbonLower: number;
    carbonUpper: number;
  }[];
  metrics: {
    mae: number; // Mean Absolute Error
    rmse: number; // Root Mean Square Error
    mape: number; // Mean Absolute Percentage Error
  };
  trends: {
    energyGrowth: number; // % per year
    costGrowth: number; // % per year
    carbonIntensity: number; // kg CO2 per kWh
  };
}

/**
 * Simple linear regression with seasonal adjustment
 */
export function forecastEnergyConsumption(
  input: ForecastInput
): ForecastResult {
  const { historicalData, horizon, seasonality = true } = input;

  if (historicalData.length < 3) {
    throw new Error('Need at least 3 months of historical data');
  }

  // Calculate trends
  const energyTrend = calculateTrend(historicalData.map((d) => d.energy));
  const costTrend = calculateTrend(historicalData.map((d) => d.cost));
  const carbonData = historicalData.map((d) => d.carbon);

  // Calculate seasonal factors (if enabled)
  const seasonalFactors = seasonality
    ? calculateSeasonalFactors(historicalData.map((d) => d.energy))
    : Array(12).fill(1);

  // Generate predictions
  const predictions = [];
  const lastDate = new Date(
    historicalData[historicalData.length - 1].timestamp
  );
  const avgEnergy =
    historicalData.reduce((sum, d) => sum + d.energy, 0) /
    historicalData.length;
  const avgCost =
    historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length;
  const avgCarbon =
    historicalData.reduce((sum, d) => sum + d.carbon, 0) /
    historicalData.length;

  for (let i = 1; i <= horizon; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(lastDate.getMonth() + i);
    const month = forecastDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    // Linear projection with seasonal adjustment
    const monthIndex = forecastDate.getMonth();
    const energyBase = avgEnergy * (1 + energyTrend * i);
    const energy = energyBase * seasonalFactors[monthIndex];

    const costBase = avgCost * (1 + costTrend * i);
    const cost = costBase * seasonalFactors[monthIndex];

    const carbon = avgCarbon * (1 + energyTrend * i) * seasonalFactors[monthIndex];

    // Confidence intervals (±15%)
    const energyMargin = energy * 0.15;
    const costMargin = cost * 0.15;
    const carbonMargin = carbon * 0.15;

    predictions.push({
      month,
      energy: Math.round(energy),
      energyLower: Math.round(energy - energyMargin),
      energyUpper: Math.round(energy + energyMargin),
      cost: Math.round(cost),
      costLower: Math.round(cost - costMargin),
      costUpper: Math.round(cost + costMargin),
      carbon: Math.round(carbon),
      carbonLower: Math.round(carbon - carbonMargin),
      carbonUpper: Math.round(carbon + carbonMargin),
    });
  }

  // Calculate forecast accuracy metrics (using last 3 months as validation)
  const validationSize = Math.min(3, historicalData.length - 1);
  const validationData = historicalData.slice(-validationSize);
  const errors = validationData.map((actual, i) => {
    const predicted =
      avgEnergy *
      (1 + energyTrend * (historicalData.length - validationSize + i));
    return Math.abs(actual.energy - predicted);
  });

  const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
  const rmse = Math.sqrt(
    errors.reduce((sum, e) => sum + e * e, 0) / errors.length
  );
  const mape =
    (errors.reduce((sum, e, i) => sum + e / validationData[i].energy, 0) /
      errors.length) *
    100;

  // Calculate carbon intensity
  const totalEnergy = historicalData.reduce((sum, d) => sum + d.energy, 0);
  const totalCarbon = historicalData.reduce((sum, d) => sum + d.carbon, 0);
  const carbonIntensity = totalCarbon / totalEnergy;

  return {
    predictions,
    metrics: {
      mae: Math.round(mae),
      rmse: Math.round(rmse),
      mape: Math.round(mape * 10) / 10,
    },
    trends: {
      energyGrowth: Math.round(energyTrend * 12 * 100 * 10) / 10,
      costGrowth: Math.round(costTrend * 12 * 100 * 10) / 10,
      carbonIntensity: Math.round(carbonIntensity * 1000) / 1000,
    },
  };
}

/**
 * Calculate linear trend (monthly growth rate)
 */
function calculateTrend(data: number[]): number {
  const n = data.length;
  if (n < 2) return 0;

  // Simple linear regression: y = mx + b
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = numerator / denominator;
  return slope / yMean; // Return as percentage growth per month
}

/**
 * Calculate seasonal factors (12 months)
 */
function calculateSeasonalFactors(data: number[]): number[] {
  const factors = Array(12).fill(1);

  if (data.length < 12) return factors;

  // Calculate average for each month
  const monthlyAverages = Array(12).fill(0);
  const monthlyCounts = Array(12).fill(0);
  const overallAverage = data.reduce((sum, v) => sum + v, 0) / data.length;

  data.forEach((value, index) => {
    const month = index % 12;
    monthlyAverages[month] += value;
    monthlyCounts[month]++;
  });

  // Calculate seasonal factors
  for (let i = 0; i < 12; i++) {
    if (monthlyCounts[i] > 0) {
      const monthAvg = monthlyAverages[i] / monthlyCounts[i];
      factors[i] = monthAvg / overallAverage;
    }
  }

  return factors;
}

/**
 * Generate synthetic historical data for testing
 */
export function generateSyntheticData(
  months: number,
  baseEnergy: number,
  growth: number = 0.02
): ForecastInput['historicalData'] {
  const data: ForecastInput['historicalData'] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);

    // Add growth and seasonal variation
    const seasonalFactor = 1 + 0.15 * Math.sin((i / 12) * 2 * Math.PI);
    const noise = 0.9 + Math.random() * 0.2; // ±10% random variation
    const energy = baseEnergy * (1 + growth * i) * seasonalFactor * noise;

    data.push({
      timestamp: date,
      energy: Math.round(energy),
      cost: Math.round(energy * 0.1), // $0.10 per kWh
      carbon: Math.round(energy * 0.5), // 0.5 kg CO2 per kWh
    });
  }

  return data;
}
