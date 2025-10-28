/**
 * Sensitivity Analysis
 * Analyzes how changes in input parameters affect key outcomes
 */

export interface SensitivityInput {
  baseCase: Record<string, number>;
  parameters: {
    name: string;
    key: string;
    min: number;
    max: number;
    steps: number;
  }[];
  outputMetrics: string[];
  calculateOutputs: (inputs: Record<string, number>) => Record<string, number>;
}

export interface SensitivityResult {
  analysis: {
    parameter: string;
    impacts: {
      value: number;
      outputs: Record<string, number>;
      percentChange: Record<string, number>;
    }[];
  }[];
  tornado: {
    metric: string;
    impacts: {
      parameter: string;
      low: number;
      high: number;
      range: number;
    }[];
  }[];
  spiderChart: {
    percentChange: number;
    metrics: Record<string, number>;
  }[];
}

/**
 * Perform one-at-a-time sensitivity analysis
 */
export function performSensitivityAnalysis(
  input: SensitivityInput
): SensitivityResult {
  const { baseCase, parameters, outputMetrics, calculateOutputs } = input;

  // Calculate base case outputs
  const baseOutputs = calculateOutputs(baseCase);

  // One-at-a-time analysis
  const analysis = parameters.map((param) => {
    const impacts = [];
    const step = (param.max - param.min) / param.steps;

    for (let i = 0; i <= param.steps; i++) {
      const value = param.min + step * i;
      const testCase = { ...baseCase, [param.key]: value };
      const outputs = calculateOutputs(testCase);

      // Calculate percent change from base case
      const percentChange: Record<string, number> = {};
      outputMetrics.forEach((metric) => {
        const change =
          ((outputs[metric] - baseOutputs[metric]) / baseOutputs[metric]) * 100;
        percentChange[metric] = Math.round(change * 10) / 10;
      });

      impacts.push({
        value: Math.round(value * 100) / 100,
        outputs,
        percentChange,
      });
    }

    return {
      parameter: param.name,
      impacts,
    };
  });

  // Generate tornado chart data (shows which parameters have biggest impact)
  const tornado = outputMetrics.map((metric) => {
    const impacts = parameters.map((param) => {
      // Find low and high values for this parameter
      const paramAnalysis = analysis.find((a) => a.parameter === param.name);
      if (!paramAnalysis) return null;

      const lowImpact = paramAnalysis.impacts[0].outputs[metric];
      const highImpact =
        paramAnalysis.impacts[paramAnalysis.impacts.length - 1].outputs[metric];
      const range = Math.abs(highImpact - lowImpact);

      return {
        parameter: param.name,
        low: Math.round(lowImpact),
        high: Math.round(highImpact),
        range: Math.round(range),
      };
    });

    // Sort by range (biggest impact first)
    const sortedImpacts = impacts
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .sort((a, b) => b.range - a.range);

    return {
      metric,
      impacts: sortedImpacts,
    };
  });

  // Generate spider chart data (shows sensitivity across all metrics)
  const spiderChart: { percentChange: number; metrics: Record<string, number> }[] = [];
  const percentChanges = [-50, -30, -10, 0, 10, 30, 50];

  percentChanges.forEach((pctChange) => {
    const metrics: Record<string, number> = {};

    // For each metric, calculate average impact across all parameters
    outputMetrics.forEach((metric) => {
      let totalImpact = 0;
      let count = 0;

      parameters.forEach((param) => {
        const paramAnalysis = analysis.find((a) => a.parameter === param.name);
        if (!paramAnalysis) return;

        // Find impact closest to this percent change
        const target = baseCase[param.key] * (1 + pctChange / 100);
        const closest = paramAnalysis.impacts.reduce((prev, curr) =>
          Math.abs(curr.value - target) < Math.abs(prev.value - target)
            ? curr
            : prev
        );

        totalImpact += closest.percentChange[metric] || 0;
        count++;
      });

      metrics[metric] =
        count > 0 ? Math.round((totalImpact / count) * 10) / 10 : 0;
    });

    spiderChart.push({
      percentChange: pctChange,
      metrics,
    });
  });

  return {
    analysis,
    tornado,
    spiderChart,
  };
}

/**
 * Monte Carlo simulation for risk analysis
 */
export interface MonteCarloInput {
  parameters: {
    name: string;
    key: string;
    mean: number;
    stdDev: number;
    distribution: "normal" | "uniform";
  }[];
  iterations: number;
  calculateOutputs: (inputs: Record<string, number>) => Record<string, number>;
}

export interface MonteCarloResult {
  statistics: {
    metric: string;
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    p10: number;
    p90: number;
  }[];
  distribution: Record<string, number[]>;
}

export function runMonteCarloSimulation(
  input: MonteCarloInput
): MonteCarloResult {
  const { parameters, iterations, calculateOutputs } = input;
  const allOutputs: Record<string, number>[] = [];

  // Run simulations
  for (let i = 0; i < iterations; i++) {
    const inputs: Record<string, number> = {};

    // Sample each parameter
    parameters.forEach((param) => {
      if (param.distribution === "normal") {
        inputs[param.key] = sampleNormal(param.mean, param.stdDev);
      } else {
        const range = param.stdDev * Math.sqrt(12); // Convert stdDev to uniform range
        inputs[param.key] = sampleUniform(
          param.mean - range / 2,
          param.mean + range / 2
        );
      }
    });

    const outputs = calculateOutputs(inputs);
    allOutputs.push(outputs);
  }

  // Calculate statistics
  const metrics = Object.keys(allOutputs[0]);
  const statistics = metrics.map((metric) => {
    const values = allOutputs.map((o) => o[metric]).sort((a, b) => a - b);

    return {
      metric,
      mean: Math.round(average(values)),
      median: Math.round(percentile(values, 50)),
      stdDev: Math.round(standardDeviation(values)),
      min: Math.round(Math.min(...values)),
      max: Math.round(Math.max(...values)),
      p10: Math.round(percentile(values, 10)),
      p90: Math.round(percentile(values, 90)),
    };
  });

  // Get distribution data
  const distribution: Record<string, number[]> = {};
  metrics.forEach((metric) => {
    distribution[metric] = allOutputs.map((o) => Math.round(o[metric]));
  });

  return {
    statistics,
    distribution,
  };
}

// Statistical helper functions
function sampleNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

function sampleUniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function percentile(sortedValues: number[], p: number): number {
  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function standardDeviation(values: number[]): number {
  const avg = average(values);
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}
