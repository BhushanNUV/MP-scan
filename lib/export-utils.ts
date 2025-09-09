export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface VitalData {
  recordedAt: string | Date;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bloodGlucose?: number;
  weight?: number;
  bmi?: number;
  painLevel?: number;
  notes?: string;
  symptoms?: string;
}

export function formatVitalsForExport(vitals: VitalData[]) {
  return vitals.map(v => ({
    'Date': new Date(v.recordedAt).toLocaleDateString(),
    'Time': new Date(v.recordedAt).toLocaleTimeString(),
    'Blood Pressure': v.bloodPressureSystolic && v.bloodPressureDiastolic 
      ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` 
      : '',
    'Heart Rate (bpm)': v.heartRate || '',
    'Temperature (°F)': v.temperature || '',
    'Oxygen Saturation (%)': v.oxygenSaturation || '',
    'Respiratory Rate': v.respiratoryRate || '',
    'Blood Glucose (mg/dL)': v.bloodGlucose || '',
    'Weight (kg)': v.weight || '',
    'BMI': v.bmi ? v.bmi.toFixed(2) : '',
    'Pain Level': v.painLevel || '',
    'Notes': v.notes || '',
    'Symptoms': v.symptoms || '',
  }));
}

interface SummaryData {
  bloodPressureSystolic?: { average: number };
  heartRate?: { average: number };
}

interface ReportData {
  vitals?: VitalData[];
  summary?: SummaryData;
  patient?: Record<string, unknown>;
  healthScore?: number;
}

export async function generatePDFReport(data: ReportData, period: string) {
  // This would integrate with a PDF library like jsPDF
  // For now, we'll create a simple HTML report that can be printed to PDF
  
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Health Vitals Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; }
        .stat-label { font-size: 12px; color: #666; }
        .stat-value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Health Vitals Report</h1>
        <p>Period: ${period}</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <h2>Summary Statistics</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Average Blood Pressure</div>
            <div class="stat-value">${data.summary?.bloodPressureSystolic?.average || 'N/A'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Heart Rate</div>
            <div class="stat-value">${data.summary?.heartRate?.average || 'N/A'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Health Score</div>
            <div class="stat-value">${data.healthScore || 'N/A'}%</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This report is for informational purposes only. Consult your healthcare provider for medical advice.</p>
      </div>
    </body>
    </html>
  `;
  
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(reportHTML);
    newWindow.document.close();
    setTimeout(() => {
      newWindow.print();
    }, 500);
  }
}