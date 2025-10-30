import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
    const { scanId } = await request.json();

    if (!scanId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Scan ID is required' 
        },
        { status: 400 }
      );
    }

    // Fetch the vital data
    const vital = await prisma.vitals.findUnique({
      where: { id: scanId },
      include: {
        Patient: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!vital) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Scan not found' 
        },
        { status: 404 }
      );
    }

    // Generate HTML content for PDF
    const htmlContent = generateReportHTML(vital);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Convert PDF buffer to base64
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        scanId,
        reportDate: new Date().toISOString(),
        pdfBase64,
        fileName: `health-report-${scanId}.pdf`
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateReportHTML(vital: any): string {
  // Calculate health metrics
  const heartRate = vital.heartRate || 0;
  const hrvSdnn = vital.hrvSdnn || 0;
  const stressLevel = vital.stressLevel || 0;
  const rrInterval = heartRate > 0 ? 60 / heartRate : 0;
  const prInterval = 160 - (heartRate - 60) * 0.4;
  const qrsDuration = 90 + stressLevel * 20;
  const qtInterval = 400 - (heartRate - 60) * 2;
  const qtcInterval = rrInterval > 0 ? qtInterval / Math.sqrt(rrInterval) : 0;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Health Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .patient-info {
            background: linear-gradient(to right, #eff6ff, #f0f9ff);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #2563eb;
          }
          .patient-info h3 {
            color: #1e40af;
            margin-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 20px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          .metric {
            padding: 15px;
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
          }
          .metric-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
          }
          .metric-unit {
            font-size: 14px;
            color: #6b7280;
            font-weight: normal;
          }
          .risk-assessment {
            padding: 12px 16px;
            margin: 10px 0;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .risk-low {
            background: #d1fae5;
            color: #065f46;
            border-left: 4px solid #10b981;
          }
          .risk-medium {
            background: #fed7aa;
            color: #9a3412;
            border-left: 4px solid #f97316;
          }
          .risk-high {
            background: #fee2e2;
            color: #991b1b;
            border-left: 4px solid #ef4444;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medical Health Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <div class="patient-info">
          <h3>Patient Information</h3>
          <div class="info-grid">
            <div><strong>Name:</strong> ${vital.name || 'Not provided'}</div>
            <div><strong>Phone:</strong> ${vital.phoneNumber || 'Not provided'}</div>
            <div><strong>Recording Date:</strong> ${new Date(vital.recordedAt).toLocaleString()}</div>
            <div><strong>Data Source:</strong> ${vital.source || 'Device'}</div>
          </div>
        </div>

        ${vital.heartRate ? `
        <div class="section">
          <h2>Vital Signs</h2>
          <div class="metrics-grid">
            ${vital.heartRate ? `
              <div class="metric">
                <div class="metric-label">Heart Rate</div>
                <div class="metric-value">${vital.heartRate} <span class="metric-unit">bpm</span></div>
              </div>
            ` : ''}
            ${vital.oxygenSaturation ? `
              <div class="metric">
                <div class="metric-label">Oxygen Saturation</div>
                <div class="metric-value">${vital.oxygenSaturation}<span class="metric-unit">%</span></div>
              </div>
            ` : ''}
            ${vital.bloodPressureSystolic ? `
              <div class="metric">
                <div class="metric-label">Blood Pressure</div>
                <div class="metric-value">${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} <span class="metric-unit">mmHg</span></div>
              </div>
            ` : ''}
            ${vital.temperature ? `
              <div class="metric">
                <div class="metric-label">Temperature</div>
                <div class="metric-value">${vital.temperature}<span class="metric-unit">°C</span></div>
              </div>
            ` : ''}
            ${vital.breathingRate ? `
              <div class="metric">
                <div class="metric-label">Breathing Rate</div>
                <div class="metric-value">${vital.breathingRate} <span class="metric-unit">rpm</span></div>
              </div>
            ` : ''}
            ${vital.bloodGlucose ? `
              <div class="metric">
                <div class="metric-label">Blood Glucose</div>
                <div class="metric-value">${vital.bloodGlucose} <span class="metric-unit">mg/dL</span></div>
              </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${(vital.hrvSdnn || vital.stressLevel || vital.pnsIndex || vital.snsIndex) ? `
        <div class="section">
          <h2>Stress & HRV Analysis</h2>
          <div class="metrics-grid">
            ${vital.stressLevel !== undefined && vital.stressLevel !== null ? `
              <div class="metric">
                <div class="metric-label">Stress Level</div>
                <div class="metric-value">${(vital.stressLevel * 100).toFixed(0)}<span class="metric-unit">%</span></div>
              </div>
            ` : ''}
            ${vital.hrvSdnn ? `
              <div class="metric">
                <div class="metric-label">HRV SDNN</div>
                <div class="metric-value">${vital.hrvSdnn.toFixed(1)} <span class="metric-unit">ms</span></div>
              </div>
            ` : ''}
            ${vital.pnsIndex ? `
              <div class="metric">
                <div class="metric-label">PNS Index</div>
                <div class="metric-value">${vital.pnsIndex.toFixed(2)}</div>
              </div>
            ` : ''}
            ${vital.snsIndex ? `
              <div class="metric">
                <div class="metric-label">SNS Index</div>
                <div class="metric-value">${vital.snsIndex.toFixed(2)}</div>
              </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${(vital.diabeticRisk || vital.hypertensionRisk || vital.heartAttackRisk || vital.strokeRisk) ? `
        <div class="section">
          <h2>Health Risk Assessment</h2>
          ${vital.diabeticRisk ? `
            <div class="risk-assessment risk-${vital.diabeticRisk.toLowerCase()}">
              <strong>Diabetic Risk</strong>
              <span>${vital.diabeticRisk.toUpperCase()}${vital.diabeticRiskProbability ? ` (${(vital.diabeticRiskProbability * 100).toFixed(1)}%)` : ''}</span>
            </div>
          ` : ''}
          ${vital.hypertensionRisk ? `
            <div class="risk-assessment risk-${vital.hypertensionRisk.toLowerCase()}">
              <strong>Hypertension Risk</strong>
              <span>${vital.hypertensionRisk.toUpperCase()}${vital.hypertensionRiskProbability ? ` (${(vital.hypertensionRiskProbability * 100).toFixed(1)}%)` : ''}</span>
            </div>
          ` : ''}
          ${vital.heartAttackRisk ? `
            <div class="risk-assessment risk-${vital.heartAttackRisk.toLowerCase()}">
              <strong>Heart Attack Risk</strong>
              <span>${vital.heartAttackRisk.toUpperCase()}${vital.heartAttackRiskProbability ? ` (${(vital.heartAttackRiskProbability * 100).toFixed(1)}%)` : ''}</span>
            </div>
          ` : ''}
          ${vital.strokeRisk ? `
            <div class="risk-assessment risk-${vital.strokeRisk.toLowerCase()}">
              <strong>Stroke Risk</strong>
              <span>${vital.strokeRisk.toUpperCase()}${vital.strokeRiskProbability ? ` (${(vital.strokeRiskProbability * 100).toFixed(1)}%)` : ''}</span>
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>Important Notice:</strong> This report is generated for informational purposes only.</p>
          <p>Please consult with a qualified healthcare professional for medical advice.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Health Monitoring System</p>
        </div>
      </body>
    </html>
  `;
}