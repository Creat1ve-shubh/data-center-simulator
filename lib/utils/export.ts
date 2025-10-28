/**
 * Export Utilities
 * Functions to export data and reports to PDF and CSV formats
 */

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename: string = 'export.csv'
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle strings with commas by wrapping in quotes
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create and trigger download
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export simulation results to comprehensive CSV
 */
export function exportSimulationResults(
  metadata: Record<string, any>,
  metrics: Record<string, any>[],
  timeline: Record<string, any>[],
  filename: string = 'simulation-results.csv'
): void {
  const sections: string[] = [];

  // Add metadata section
  sections.push('SIMULATION METADATA');
  Object.entries(metadata).forEach(([key, value]) => {
    sections.push(`${key},${value}`);
  });
  sections.push(''); // Empty line

  // Add metrics section
  if (metrics.length > 0) {
    sections.push('METRICS');
    const metricHeaders = Object.keys(metrics[0]);
    sections.push(metricHeaders.join(','));
    metrics.forEach((metric) => {
      sections.push(metricHeaders.map((h) => metric[h]).join(','));
    });
    sections.push('');
  }

  // Add timeline section
  if (timeline.length > 0) {
    sections.push('TIMELINE');
    const timelineHeaders = Object.keys(timeline[0]);
    sections.push(timelineHeaders.join(','));
    timeline.forEach((item) => {
      sections.push(timelineHeaders.map((h) => item[h]).join(','));
    });
  }

  const csvContent = sections.join('\n');
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export report to PDF (using browser print)
 */
export function exportToPDF(
  elementId: string,
  filename: string = 'report.pdf'
): void {
  // Store original title
  const originalTitle = document.title;
  document.title = filename;

  // Get the element to print
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found`);
    return;
  }

  // Clone the element to avoid modifying the original
  const printContent = element.cloneNode(true) as HTMLElement;

  // Create a print-friendly wrapper
  const printWindow = document.createElement('div');
  printWindow.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 99999;
    overflow: auto;
    padding: 40px;
  `;
  printWindow.appendChild(printContent);

  // Add to document
  document.body.appendChild(printWindow);

  // Add print styles
  const printStyles = document.createElement('style');
  printStyles.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-content,
      #print-content * {
        visibility: visible;
      }
      #print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      @page {
        margin: 1cm;
      }
    }
  `;
  printWindow.id = 'print-content';
  document.head.appendChild(printStyles);

  // Trigger print dialog
  setTimeout(() => {
    window.print();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(printWindow);
      document.head.removeChild(printStyles);
      document.title = originalTitle;
    }, 100);
  }, 500);
}

/**
 * Export chart as PNG image
 */
export function exportChartAsPNG(
  chartElement: HTMLElement,
  filename: string = 'chart.png'
): void {
  // This is a simple implementation. For production, consider using html2canvas or similar library
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size to match element
  canvas.width = chartElement.offsetWidth * 2; // 2x for better quality
  canvas.height = chartElement.offsetHeight * 2;

  // Scale context
  ctx.scale(2, 2);

  // Draw white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Try to capture SVG elements (for recharts)
  const svgElements = chartElement.querySelectorAll('svg');
  if (svgElements.length > 0) {
    svgElements.forEach((svg) => {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        // Convert to PNG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      };

      img.src = url;
    });
  } else {
    // Fallback: just show a message
    console.warn(
      'Chart export: Consider using html2canvas library for better quality'
    );
  }
}

/**
 * Helper function to trigger file download
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format data for export (handles dates, numbers, etc.)
 */
export function formatForExport(
  data: Record<string, any>[]
): Record<string, any>[] {
  return data.map((row) => {
    const formatted: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
      if (value instanceof Date) {
        formatted[key] = value.toISOString().split('T')[0];
      } else if (typeof value === 'number') {
        formatted[key] = Math.round(value * 100) / 100; // Round to 2 decimals
      } else {
        formatted[key] = value;
      }
    });
    return formatted;
  });
}

/**
 * Generate summary statistics for export
 */
export function generateSummaryStats(
  data: number[]
): Record<string, number> {
  if (data.length === 0) return {};

  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;
  const median = sorted[Math.floor(data.length / 2)];
  const min = sorted[0];
  const max = sorted[data.length - 1];

  // Calculate standard deviation
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: data.length,
    sum: Math.round(sum),
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}
