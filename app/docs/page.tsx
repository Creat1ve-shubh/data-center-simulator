import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-gray-600 mt-1">Complete guide to using GreenCloud</p>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          GreenCloud is a research-grade data center energy efficiency simulator developed at Manipal University Jaipur.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Metrics Explained</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">PUE (Power Usage Effectiveness)</h3>
            <p className="text-sm text-gray-600 mb-2">PUE = Total Facility Energy / IT Equipment Energy</p>
            <p className="text-sm">
              Measures overall efficiency. PUE of 1.0 is perfect (all power goes to IT). Industry average is 1.6,
              best-in-class is 1.1-1.2.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">CUE (Carbon Usage Effectiveness)</h3>
            <p className="text-sm text-gray-600 mb-2">CUE = Total CO₂ Emissions / IT Equipment Energy</p>
            <p className="text-sm">
              Measures carbon intensity. Lower is better. Depends on grid carbon intensity and renewable usage.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">WUE (Water Usage Effectiveness)</h3>
            <p className="text-sm text-gray-600 mb-2">WUE = Total Water Usage / IT Equipment Energy</p>
            <p className="text-sm">Measures water consumption for cooling. Critical in water-scarce regions.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How the Auto-Plan Algorithm Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Step 1: Data Collection</h3>
            <p className="text-sm">
              Ingests hourly IT load, weather data, and grid carbon intensity for your location.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 2: Capacity Sizing</h3>
            <p className="text-sm">
              Calculates optimal solar, wind, and battery capacities to cover 60-70% of annual energy while minimizing
              costs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 3: Hourly Dispatch</h3>
            <p className="text-sm">
              Simulates hour-by-hour energy flow: use renewables first, charge/discharge battery strategically, minimize
              grid usage during high-carbon hours.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Step 4: Financial Analysis</h3>
            <p className="text-sm">
              Calculates CAPEX, OPEX, ROI, and compares against grid-only baseline to quantify savings.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using the Simulator</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>Select your location from the dropdown (determines solar/wind availability and grid carbon)</li>
            <li>Set your average IT load using the slider (typical range: 5-50 kW for small-medium facilities)</li>
            <li>Click "Run Auto-Plan Optimization" to calculate optimal renewable mix</li>
            <li>Review recommendations: solar/wind/battery capacities, costs, savings, and ROI</li>
            <li>Explore tabs to see infrastructure breakdown, baseline comparison, and hourly dispatch</li>
            <li>Use results to make informed decisions about renewable investments</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Solar Data:</strong> Based on NREL NSRDB patterns for each location
          </p>
          <p>
            <strong>Wind Data:</strong> Modeled using NREL Wind Toolkit profiles
          </p>
          <p>
            <strong>Grid Carbon:</strong> Regional averages from IEA, EPA eGRID, and ENTSO-E
          </p>
          <p>
            <strong>Workload Traces:</strong> Realistic patterns based on typical data center operations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Research Paper</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-4">
            This simulator is described in the research paper:
            <br />
            <strong>"GreenCloud: A Data-Center Energy Efficiency Simulator and Transition Roadmap"</strong>
            <br />
            Shubh Shrivastava, Manipal University Jaipur
          </p>
          <p>For technical details, methodology, and validation results, please refer to the full paper.</p>
        </CardContent>
      </Card>
    </div>
  )
}
