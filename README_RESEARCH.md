# Data Center Simulator: Research-Grade Platform

## Quick Start

### 1. Generate Research Data
\`\`\`typescript
import { generateRealDataset } from '@/lib/data/real-datasets';
import { REGIONS } from '@/lib/data/regions';

const region = REGIONS[0]; // California
const data = generateRealDataset(region, 365); // 1 year of data
\`\`\`

### 2. Run Optimization
\`\`\`typescript
import { optimizeRenewableTransition } from '@/lib/optimization/optimization-algorithm';

const result = optimizeRenewableTransition(data, region, {
  budget_USD: 10000000,
  target_renewable_percentage: 80,
  planning_horizon_years: 10,
});
\`\`\`

### 3. Compare Baselines
\`\`\`typescript
import { compareBaselines } from '@/lib/validation/baseline-comparisons';

const baselines = compareBaselines(data, region);
\`\`\`

### 4. Sensitivity Analysis
\`\`\`typescript
import { performSensitivityAnalysis } from '@/lib/optimization/sensitivity-analysis';

const sensitivity = performSensitivityAnalysis(data, region);
\`\`\`

### 5. Export Results
\`\`\`typescript
import { createReproducibilityPackage, exportReproducibilityPackage } from '@/lib/utils/reproducibility';

const pkg = createReproducibilityPackage(region, data, results, baselines, sensitivity);
const json = exportReproducibilityPackage(pkg);
\`\`\`

## Research Dashboard

Access the research dashboard at `/research` to:
- Compare optimization algorithms
- View sensitivity analysis results
- Analyze financial scenarios
- Export reproducibility packages

## Testing

Use test helpers to validate results:
\`\`\`typescript
import { generateMockTelemetry, validateOptimizationResult } from '@/lib/utils/test-helpers';

const mockData = generateMockTelemetry(100);
const result = optimizeRenewableTransition(mockData, region, {...});
const isValid = validateOptimizationResult(result);
\`\`\`

## Publications

This platform is designed for research publications. All results include:
- Real data sources (Google Cluster Trace, NREL)
- Mathematical formalization of the optimization problem
- Baseline comparisons and sensitivity analysis
- Uncertainty quantification
- Reproducibility package for peer review

## Contributing

To contribute to the research platform:
1. Add new data sources in `lib/data/`
2. Implement new algorithms in `lib/optimization/`
3. Add forecasting models in `lib/forecasting/`
4. Update test helpers in `lib/utils/test-helpers.ts`
5. Document assumptions in `RESEARCH_METHODOLOGY.md`
