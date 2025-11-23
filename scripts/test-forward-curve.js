// Simple test for /api/orchestrate with VPPA forward curve
const fetch = global.fetch;

async function run(){
  const body = {
    coordinates: { latitude: 37.77, longitude: -122.42 },
    currentLoad: { averageKW: 1000, peakKW: 1200, currentPUE: 1.5 },
    constraints: { budget: 2_000_000, targetRenewableFraction: 0.8 },
    pricing: {
      electricityUSDPerKWh: 0.12,
      carbonUSDPerTon: 50,
      solarCapexUSDPerKW: 1200,
      windCapexUSDPerKW: 1500,
      batteryCapexUSDPerKWh: 400
    },
    vppa: {
      considerVPPA: true,
      strikePrice: 85, // USD/MWh
      contractDuration: 10,
      forwardCurve: [90,92,94,96,98,100,102,104,106,108]
    },
    sensitivity: { runMonteCarlo: false }
  };
  const res = await fetch('http://localhost:3000/api/orchestrate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  const json = await res.json();
  console.log('Status:', res.status);
  if(json.stages?.financial?.vppa){
    console.log('VPPA annual_cash_flows (first 3 years):', json.stages.financial.vppa.annual_cash_flows.slice(0,3));
    console.log('Strike vs Forward(Year1):', json.stages.financial.vppa.strike_price_per_mwh, json.stages.financial.vppa.annual_cash_flows[0].market_price);
  } else {
    console.log('No VPPA section in response');
  }
}
run().catch(e=>{console.error(e); process.exit(1);});
