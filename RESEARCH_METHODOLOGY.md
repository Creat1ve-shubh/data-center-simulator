# Data Center Simulator: Research Methodology

## Overview

This document describes the research-grade methodology implemented in the Data Center Simulator, transforming it from a demo tool into a publishable research platform.

## Phases

### Phase 1: Data Foundation
- **Real Workload Data**: Google Cluster Trace, Azure workload patterns
- **Real Weather Data**: NREL NSRDB (solar irradiance), NREL Wind Toolkit (wind speed)
- **Grid Carbon Intensity**: ENTSO-E (Europe), EPA (USA), regional data
- **Dynamic Energy Model**: PUE calculation based on temperature, IT load, cooling efficiency

### Phase 2: Algorithm Formalization
- **Decision Variables**: Solar capacity, wind capacity, hydro capacity, battery storage, grid import
- **Objective Function**: Minimize total cost (CapEx + OpEx - savings)
- **Constraints**: Energy balance, capacity limits, budget constraints, renewable targets
- **Solutions**: Heuristic (greedy) and LP-based optimization

### Phase 3: Validation & Comparison
- **Baselines**: Grid-only, manual planning, greedy dispatch
- **Sensitivity Analysis**: Budget, tariff, renewable targets, LCOE
- **Comparative Metrics**: Cost, savings, payback period, ROI, emissions reduction

### Phase 4: Forecasting Models
- **Solar Forecasting**: Gradient boosting on historical patterns and weather
- **Wind Forecasting**: Gradient boosting on historical patterns and weather
- **Uncertainty Quantification**: Confidence intervals and probabilistic forecasts

### Phase 5: Financial Modeling
- **VPPA/PPA Contracts**: Price, duration, volume, escalation
- **Financial Analysis**: NPV, IRR, payback period, cost avoidance
- **Price Stability**: Benefits of long-term contracts

### Phase 6: User Validation
- **Research Dashboard**: Comparative results, sensitivity analysis, financial scenarios
- **User Study**: 5-10 data center operators/engineers
- **Feedback Collection**: Usability, effectiveness, recommendations

### Phase 7: Code Quality & Documentation
- **Modular Structure**: Separate modules for data, optimization, forecasting, financial
- **Test Helpers**: Mock data generation, result validation, comparison utilities
- **Reproducibility Package**: JSON export, CSV export, assumptions documentation
- **Research Methodology**: This document

## Key Assumptions

1. **Dynamic PUE**: PUE = 1.2 + 0.3 * (outdoor_temp - 20) / 10 + 0.1 * (IT_load / max_IT_load)
2. **Economizer Cooling**: 0.3 kW per kW IT load when outdoor temp < 15°C
3. **Capacity Factors**: Solar 0.25, Wind 0.35, Hydro 0.40 (global averages)
4. **Battery Efficiency**: 85% round-trip efficiency
5. **Grid Carbon Intensity**: Region-specific, time-varying

## Data Sources

- **Workloads**: Google Cluster Trace v2, Azure Public Dataset
- **Weather**: NREL NSRDB (solar), NREL Wind Toolkit (wind)
- **Grid Carbon**: ENTSO-E (Europe), EPA (USA), IEA (global)
- **LCOE**: IRENA Renewable Cost Database 2023

## Reproducibility

All results are exported with:
- Input data (telemetry, weather, grid carbon)
- Algorithm version and parameters
- Optimization results and baselines
- Sensitivity analysis results
- Assumptions and metadata

## References

- Google Cluster Trace: https://github.com/google/cluster-data
- NREL NSRDB: https://nsrdb.nrel.gov/
- NREL Wind Toolkit: https://windtoolkit.nrel.gov/
- IRENA LCOE Database: https://www.irena.org/publications/2023-Jun/Renewable-Power-Generation-Costs-in-2023
