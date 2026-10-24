import QRCode from 'qrcode';
import { ScoredBikeResult, UserPreferences } from '../matching-engine/types';
import fs from 'fs';
import path from 'path';

const SEGMENT_SVGS: Record<string, string> = {
  Commuter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%" fill="none">
    <circle cx="45" cy="80" r="25" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="45" cy="80" r="10" fill="#cbd5e1"/>
    <circle cx="155" cy="80" r="25" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="155" cy="80" r="10" fill="#cbd5e1"/>
    <path d="M45 80 L75 55 L115 55 L155 80" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M75 55 L85 80 L125 80 L115 55" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M100 48 C115 48 135 50 140 60 C135 65 115 62 100 62 Z" fill="#F26B1D"/>
    <path d="M70 52 C85 52 105 52 110 55 C100 58 85 58 70 56 Z" fill="#334155"/>
    <path d="M135 40 L140 60" stroke="#0B1F3A" stroke-width="4" stroke-linecap="round"/>
    <path d="M130 38 L142 42" stroke="#0B1F3A" stroke-width="4" stroke-linecap="round"/>
    <path d="M95 82 L160 82" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  Sports: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%" fill="none">
    <circle cx="45" cy="80" r="25" stroke="#94a3b8" stroke-width="7"/>
    <circle cx="45" cy="80" r="10" fill="#cbd5e1"/>
    <circle cx="155" cy="80" r="25" stroke="#94a3b8" stroke-width="7"/>
    <circle cx="155" cy="80" r="10" fill="#cbd5e1"/>
    <path d="M45 80 L80 60 L125 50 L155 80" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <path d="M110 40 Q135 38 150 55 L125 75 Z" fill="#F26B1D"/>
    <path d="M135 48 L145 52" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <path d="M70 48 L95 56 L70 60 Z" fill="#334155"/>
    <path d="M90 82 L135 70" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
  Cruiser: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%" fill="none">
    <circle cx="35" cy="80" r="24" stroke="#94a3b8" stroke-width="7"/>
    <circle cx="35" cy="80" r="9" fill="#cbd5e1"/>
    <circle cx="165" cy="80" r="26" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="165" cy="80" r="9" fill="#cbd5e1"/>
    <path d="M35 80 L75 68 L115 54 L165 80" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <path d="M90 50 Q115 48 128 62 L95 64 Z" fill="#F26B1D"/>
    <path d="M60 62 Q75 62 88 64 L75 70 Z" fill="#334155"/>
    <path d="M125 45 L135 34" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <path d="M80 84 L160 84" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
  Scooter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%" fill="none">
    <circle cx="45" cy="85" r="20" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="45" cy="85" r="8" fill="#cbd5e1"/>
    <circle cx="155" cy="85" r="20" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="155" cy="85" r="8" fill="#cbd5e1"/>
    <path d="M135 45 Q155 58 150 82" stroke="#0B1F3A" stroke-width="6" stroke-linecap="round"/>
    <path d="M90 85 L135 85" stroke="#0B1F3A" stroke-width="6" stroke-linecap="round"/>
    <path d="M50 78 Q75 62 100 62 L95 85 L50 85 Z" fill="#F26B1D"/>
    <path d="M60 58 Q85 58 105 60 L100 64 L60 62 Z" fill="#334155"/>
    <path d="M132 40 L140 46" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <circle cx="140" cy="44" r="4" fill="#facc15"/>
  </svg>`,
  Electric: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%" fill="none">
    <circle cx="45" cy="85" r="20" stroke="#10b981" stroke-width="6"/>
    <circle cx="45" cy="85" r="8" fill="#a7f3d0"/>
    <circle cx="155" cy="85" r="20" stroke="#10b981" stroke-width="6"/>
    <circle cx="155" cy="85" r="8" fill="#a7f3d0"/>
    <path d="M136 42 L150 78" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <rect x="85" y="80" width="45" height="10" rx="3" fill="#059669"/>
    <path d="M52 76 L85 64 L102 64 L90 82 Z" fill="#0B1F3A"/>
    <path d="M62 60 L102 60 L100 64 L62 64 Z" fill="#1e293b"/>
    <path d="M102 70 L97 78 L101 78 L98 86 L106 76 L102 76 Z" fill="#facc15"/>
  </svg>`,
  Adventure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%" fill="none">
    <circle cx="45" cy="85" r="23" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="45" cy="85" r="9" fill="#cbd5e1"/>
    <circle cx="155" cy="82" r="26" stroke="#94a3b8" stroke-width="6"/>
    <circle cx="155" cy="82" r="9" fill="#cbd5e1"/>
    <path d="M45 85 L75 52 L115 50 L155 82" stroke="#0B1F3A" stroke-width="5" stroke-linecap="round"/>
    <path d="M100 45 L135 45 L152 56 L115 60 Z" fill="#F26B1D"/>
    <path d="M135 44 L142 28" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round"/>
    <path d="M65 52 L100 52 L100 58 L65 58 Z" fill="#334155"/>
    <path d="M90 85 L145 68" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
};

function getSegmentSvg(segment: string): string {
  return SEGMENT_SVGS[segment] || SEGMENT_SVGS['Commuter'];
}

function renderPdfBikeImage(
  bike: { heroImage?: string | null; brandName: string; modelName: string; segment: string },
  mode: 'thumb' | 'large'
): string {
  if (bike.heroImage) {
    let src = bike.heroImage;
    if (src.startsWith('/')) {
      try {
        const localPath = path.join(process.cwd(), 'public', src);
        if (fs.existsSync(localPath)) {
          const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
          const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
          const b64 = fs.readFileSync(localPath).toString('base64');
          src = `data:${mime};base64,${b64}`;
        }
      } catch (e) {
        // fallback to original src
      }
    }

    if (mode === 'thumb') {
      return `<img class="rank-image" src="${src}" alt="${bike.modelName}">`;
    }
    return `<img src="${src}" alt="${bike.modelName}" style="width: 48%; height: 180px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc;">`;
  }

  const svg = getSegmentSvg(bike.segment);
  if (mode === 'thumb') {
    return `
      <div class="rank-image" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; box-sizing: border-box; text-align: center;">
        <div style="width: 100%; height: 36px; display: flex; align-items: center; justify-content: center;">
          ${svg}
        </div>
        <div style="font-size: 5.5pt; color: #b45309; font-weight: 700; text-transform: uppercase;">Photo Pending</div>
      </div>
    `;
  }

  return `
    <div style="width: 48%; height: 180px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 12px; box-sizing: border-box;">
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase;">
        <span>${bike.segment} Segment</span>
        <span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a; font-size: 7pt;">Photo Pending Verification</span>
      </div>
      <div style="width: 100%; height: 95px; display: flex; align-items: center; justify-content: center;">
        ${svg}
      </div>
      <div style="width: 100%; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
        <div style="font-size: 8.5pt; font-weight: 700; color: #0B1F3A;">${bike.brandName} ${bike.modelName}</div>
        <div style="font-size: 7pt; color: #94a3b8;">Specifications Verified by Bike4U</div>
      </div>
    </div>
  `;
}

export interface ReportData {
  reportId: string;
  reportDate: string;
  shareUrl: string;
  userPrefs: UserPreferences;
  results: ScoredBikeResult[];
  datasetVersion: string;
  isRelaxed: boolean;
  relaxationMessage?: string;
}

export async function generateReportHtml(data: ReportData): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(data.shareUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: '#0B1F3A',
      light: '#FFFFFF',
    },
  });

  const formattedDate = new Date(data.reportDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const topBikes = data.results.slice(0, 5);

  // Generate HTML with clean CSS print pagination (page-break-after: always)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bike for U Recommendation Report - ${data.reportId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      font-size: 11pt;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 20mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #ffffff;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0B1F3A;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }

    .brand-logo {
      font-size: 20pt;
      font-weight: 800;
      color: #0B1F3A;
      letter-spacing: -0.5px;
    }

    .brand-logo span {
      color: #F26B1D;
    }

    .report-meta-tag {
      font-size: 9pt;
      color: #64748b;
      text-align: right;
    }

    .footer-bar {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #94a3b8;
    }

    .content-body {
      flex: 1;
    }

    h1 {
      color: #0B1F3A;
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    h2 {
      color: #0B1F3A;
      font-size: 16pt;
      font-weight: 700;
      margin-bottom: 16px;
      border-left: 4px solid #F26B1D;
      padding-left: 10px;
    }

    h3 {
      color: #0B1F3A;
      font-size: 13pt;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }

    .badge-match {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #10b981;
    }

    .badge-orange {
      background: #fff7ed;
      color: #c2410c;
    }

    .badge-navy {
      background: #0B1F3A;
      color: #ffffff;
    }

    .preferences-card {
      background: #F3F5F9;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
    }

    .pref-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 10px;
    }

    .pref-item-title {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
    }

    .pref-item-val {
      font-size: 11pt;
      color: #0B1F3A;
      font-weight: 600;
    }

    .qr-box {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
      margin-top: 24px;
    }

    .qr-text {
      font-size: 9pt;
      color: #475569;
    }

    .rank-card {
      display: flex;
      align-items: center;
      background: #F3F5F9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }

    .rank-number {
      font-size: 22pt;
      font-weight: 800;
      color: #0B1F3A;
      width: 45px;
    }

    .rank-image {
      width: 75px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      margin-right: 16px;
      background: #e2e8f0;
    }

    .rank-info {
      flex: 1;
    }

    .rank-match-box {
      text-align: right;
    }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 12px;
    }

    .table-custom th, .table-custom td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }

    .table-custom th {
      background: #0B1F3A;
      color: #ffffff;
      font-weight: 600;
    }

    .table-custom tr:nth-child(even) {
      background: #f8fafc;
    }

    .best-highlight {
      background: #ecfdf5 !important;
      font-weight: 700;
      color: #059669;
    }

    .score-bar-container {
      margin-bottom: 8px;
    }

    .score-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .score-bar-bg {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .score-bar-fill {
      height: 100%;
      background: #F26B1D;
      border-radius: 4px;
    }

    .chip {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 500;
      margin-right: 4px;
      margin-bottom: 4px;
    }

    .trade-off-chip {
      display: inline-block;
      background: #fef2f2;
      color: #b91c1c;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 500;
      margin-right: 4px;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER & SUMMARY ==================== -->
  <div class="page">
    <div class="header-bar">
      <div class="brand-logo">BIKE<span>4</span>U</div>
      <div class="report-meta-tag">
        <strong>Report ID:</strong> ${data.reportId}<br>
        <strong>Generated:</strong> ${formattedDate}
      </div>
    </div>

    <div class="content-body">
      <span class="badge badge-orange" style="margin-bottom: 12px;">RECOMMENDATION REPORT</span>
      <h1>Your Personal Two-Wheeler Shortlist</h1>
      <p style="color: #64748b; font-size: 12pt; margin-bottom: 20px;">
        Curated objectively using transparent weighted scoring and verified Indian OEM specifications.
      </p>

      <div class="preferences-card">
        <h3>Your Stated Preferences</h3>
        <div class="pref-grid">
          <div>
            <div class="pref-item-title">Preferred Segment</div>
            <div class="pref-item-val">${data.userPrefs.segment}</div>
          </div>
          <div>
            <div class="pref-item-title">Budget Range (Ex-Showroom)</div>
            <div class="pref-item-val">INR ${data.userPrefs.budgetMin.toLocaleString('en-IN')} - ${data.userPrefs.budgetMax.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div class="pref-item-title">Style Preference</div>
            <div class="pref-item-val">${data.userPrefs.styles?.join(', ') || 'No preference'}</div>
          </div>
          <div>
            <div class="pref-item-title">Minimum Efficiency / Range</div>
            <div class="pref-item-val">${data.userPrefs.mileageMin ? `${data.userPrefs.mileageMin}+ ${data.userPrefs.segment === 'Electric' ? 'km/charge' : 'km/l'}` : 'No minimum'}</div>
          </div>
          <div style="grid-column: span 2;">
            <div class="pref-item-title">Must-Have Features</div>
            <div class="pref-item-val">${data.userPrefs.features?.join(', ') || 'Any standard equipment'}</div>
          </div>
        </div>
      </div>

      <div style="background: #ffffff; border-left: 4px solid #0B1F3A; padding: 14px 18px; margin: 20px 0; background: #f8fafc;">
        <h3 style="margin-bottom: 4px;">Executive Match Summary</h3>
        <p style="font-size: 10pt; color: #334155;">
          ${data.isRelaxed ? `<em>Note: ${data.relaxationMessage}</em> ` : ''}
          Our deterministic recommendation engine scored all active Indian models against your exact budget, segment ergonomics, required safety features, and fuel/range economy. Here are your <strong>top 5 matches</strong>, collapsed to the single best-value variant per model to prevent showroom confusion.
        </p>
      </div>

      <div class="qr-box">
        <img src="${qrDataUrl}" alt="QR code" width="90" height="90" style="border-radius: 4px;">
        <div class="qr-text">
          <strong style="color: #0B1F3A; font-size: 10pt;">Scan to View Live Interactive Report</strong><br>
          Access real-time price updates, full photo galleries, dealer directions, and tweak your preferences anytime.<br>
          <span style="color: #F26B1D; word-break: break-all; font-size: 8pt;">${data.shareUrl}</span>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>Bike for U &bull; www.bikeforu.in &bull; Free Consumer Tool</div>
      <div>Page 1 of ${topBikes.length + 4}</div>
    </div>
  </div>

  <!-- ==================== PAGE 2: TOP 5 AT A GLANCE ==================== -->
  <div class="page">
    <div class="header-bar">
      <div class="brand-logo">BIKE<span>4</span>U</div>
      <div class="report-meta-tag">Top 5 Matches &bull; ${data.reportId}</div>
    </div>

    <div class="content-body">
      <h2>Top 5 Matches at a Glance</h2>
      <p style="color: #64748b; font-size: 10pt; margin-bottom: 16px;">
        Ranked in descending order of total score. Scores factor in price, fuel economy, comfort features, style tags, and segment alignment.
      </p>

      ${topBikes
        .map(
          (item, idx) => `
        <div class="rank-card">
          <div class="rank-number">#${idx + 1}</div>
          ${renderPdfBikeImage(item.bike, 'thumb')}
          <div class="rank-info">
            <div style="font-size: 12pt; font-weight: 700; color: #0B1F3A;">
              ${item.bike.brandName} ${item.bike.modelName}
              <span style="font-size: 9pt; font-weight: 400; color: #64748b;">(${item.bike.name})</span>
            </div>
            <div style="font-size: 9pt; color: #475569; margin: 2px 0;">
              <strong>INR ${item.bike.exShowroomPrice.toLocaleString('en-IN')}</strong> &bull;
              ${item.bike.araiMileage ? `${item.bike.araiMileage} km/l (ARAI)` : item.bike.evRange ? `${item.bike.evRange} km/charge` : 'N/A'} &bull;
              ${item.bike.segment}
            </div>
            <div style="font-size: 8.5pt; color: #334155; margin-top: 4px;">
              <em>${item.oneLineReason}</em>
            </div>
          </div>
          <div class="rank-match-box">
            <span class="badge badge-match" style="font-size: 12pt; padding: 6px 12px;">${item.matchPercentage}%</span>
            <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">MATCH SCORE</div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="footer-bar">
      <div>Bike for U &bull; www.bikeforu.in</div>
      <div>Page 2 of ${topBikes.length + 4}</div>
    </div>
  </div>

  <!-- ==================== PAGE 3: SIDE-BY-SIDE COMPARISON TABLE ==================== -->
  <div class="page">
    <div class="header-bar">
      <div class="brand-logo">BIKE<span>4</span>U</div>
      <div class="report-meta-tag">Side-by-Side Comparison &bull; ${data.reportId}</div>
    </div>

    <div class="content-body">
      <h2>Side-by-Side Comparison</h2>
      <p style="color: #64748b; font-size: 9.5pt; margin-bottom: 12px;">
        Comparing key attributes across your top shortlisted options. Green highlight indicates top-tier metric in that dimension.
      </p>

      <table class="table-custom">
        <thead>
          <tr>
            <th style="width: 22%;">Attribute</th>
            ${topBikes.map((t) => `<th style="width: ${78 / topBikes.length}%; text-align: center;">${t.bike.modelName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Rank & Score</strong></td>
            ${topBikes.map((t, i) => `<td style="text-align: center;"><strong>#${i + 1}</strong> (${t.matchPercentage}%)</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Ex-Showroom Price</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">INR ${t.bike.exShowroomPrice.toLocaleString('en-IN')}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Mileage / Range</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.araiMileage ? `${t.bike.araiMileage} km/l` : `${t.bike.evRange} km/charge`}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Segment</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.segment}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Engine / Motor</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.engineCc ? `${t.bike.engineCc} cc` : `${t.bike.motorPower} kW`}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Max Power</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.maxPower || `${t.bike.motorPower} kW`}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Braking (ABS)</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.abs !== 'none' ? `${t.bike.abs.toUpperCase()} ABS` : 'Combined'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Front Disc Brake</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.discBrakes ? '&#10004; Yes' : '&#10008; Drum'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Digital Console</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.digitalConsole ? '&#10004; Yes' : '&#10008; Analog'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Bluetooth Pairing</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.bluetooth ? '&#10004; Yes' : '&#10008; No'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Kerb Weight</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.kerbWeight ? `${t.bike.kerbWeight} kg` : 'N/A'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Tank / Battery</strong></td>
            ${topBikes.map((t) => `<td style="text-align: center;">${t.bike.fuelTankCapacity ? `${t.bike.fuelTankCapacity} L` : `${t.bike.batteryCapacity} kWh`}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-bar">
      <div>Bike for U &bull; www.bikeforu.in</div>
      <div>Page 3 of ${topBikes.length + 4}</div>
    </div>
  </div>

  <!-- ==================== PAGES 4 to 8: ONE PER BIKE DETAIL ==================== -->
  ${topBikes
    .map(
      (item, idx) => `
    <div class="page">
      <div class="header-bar">
        <div class="brand-logo">BIKE<span>4</span>U</div>
        <div class="report-meta-tag">#${idx + 1} ${item.bike.brandName} ${item.bike.modelName} &bull; ${data.reportId}</div>
      </div>

      <div class="content-body">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <span class="badge badge-navy">RANK #${idx + 1} OF 5</span>
            <h1 style="font-size: 22pt; margin-top: 4px;">${item.bike.brandName} ${item.bike.modelName}</h1>
            <div style="font-size: 11pt; color: #475569;">
              Variant: <strong>${item.bike.name}</strong> &bull; Segment: <strong>${item.bike.segment}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24pt; font-weight: 800; color: #059669;">${item.matchPercentage}%</div>
            <div style="font-size: 8pt; color: #64748b; font-weight: 600;">MATCH SCORE</div>
          </div>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 16px;">
          ${renderPdfBikeImage(item.bike, 'large')}

          <div style="width: 50%;">
            <h3 style="font-size: 11pt;">Score Breakdown</h3>

            <div class="score-bar-container">
              <div class="score-bar-label">
                <span>Features Fit (25% weight)</span>
                <span>${Math.round(item.subScores.features)}%</span>
              </div>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${item.subScores.features}%;"></div></div>
            </div>

            <div class="score-bar-container">
              <div class="score-bar-label">
                <span>Budget Alignment (20% weight)</span>
                <span>${Math.round(item.subScores.budget)}%</span>
              </div>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${item.subScores.budget}%;"></div></div>
            </div>

            <div class="score-bar-container">
              <div class="score-bar-label">
                <span>Segment Match (20% weight)</span>
                <span>${Math.round(item.subScores.segment)}%</span>
              </div>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${item.subScores.segment}%;"></div></div>
            </div>

            <div class="score-bar-container">
              <div class="score-bar-label">
                <span>Mileage / Range (20% weight)</span>
                <span>${Math.round(item.subScores.mileage)}%</span>
              </div>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${item.subScores.mileage}%;"></div></div>
            </div>

            <div class="score-bar-container">
              <div class="score-bar-label">
                <span>Style Alignment (15% weight)</span>
                <span>${Math.round(item.subScores.style)}%</span>
              </div>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${item.subScores.style}%;"></div></div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px;">
            <strong style="color: #166534; font-size: 10pt; display: block; margin-bottom: 6px;">&#10004; Why It Matched:</strong>
            ${item.whyMatched.map((w) => `<div class="chip" style="display: block; margin-bottom: 4px;">&bull; ${w}</div>`).join('')}
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px;">
            <strong style="color: #991b1b; font-size: 10pt; display: block; margin-bottom: 6px;">&#9888; Honest Trade-offs:</strong>
            ${
              item.tradeOffs.length > 0
                ? item.tradeOffs.map((t) => `<div class="trade-off-chip" style="display: block; margin-bottom: 4px;">&bull; ${t}</div>`).join('')
                : '<div style="font-size: 9pt; color: #64748b;">No major trade-offs identified against your inputs.</div>'
            }
          </div>
        </div>

        <h3>Full Specifications</h3>
        <table class="table-custom">
          <tbody>
            <tr>
              <td style="width: 25%; font-weight: 600;">Ex-Showroom Price</td>
              <td style="width: 25%;">INR ${item.bike.exShowroomPrice.toLocaleString('en-IN')} (${item.bike.referenceCity})</td>
              <td style="width: 25%; font-weight: 600;">Efficiency / Range</td>
              <td style="width: 25%;">${item.bike.araiMileage ? `${item.bike.araiMileage} km/l (ARAI)` : `${item.bike.evRange} km/charge`}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Engine / Motor</td>
              <td>${item.bike.engineCc ? `${item.bike.engineCc} cc` : `${item.bike.motorPower} kW electric`}</td>
              <td style="font-weight: 600;">Max Power</td>
              <td>${item.bike.maxPower || `${item.bike.motorPower} kW`}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Max Torque</td>
              <td>${item.bike.maxTorque || 'N/A'}</td>
              <td style="font-weight: 600;">Transmission</td>
              <td>${item.bike.gearbox || 'Automatic'}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Braking & Safety</td>
              <td>${item.bike.abs !== 'none' ? `${item.bike.abs} ABS` : 'Standard'} &bull; ${item.bike.discBrakes ? 'Front Disc' : 'Drum'}</td>
              <td style="font-weight: 600;">Console & Tech</td>
              <td>${item.bike.digitalConsole ? 'Digital' : 'Analog'} &bull; ${item.bike.bluetooth ? 'Bluetooth Connected' : 'No Bluetooth'}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Kerb Weight</td>
              <td>${item.bike.kerbWeight ? `${item.bike.kerbWeight} kg` : 'N/A'}</td>
              <td style="font-weight: 600;">Seat Height / Clearance</td>
              <td>${item.bike.seatHeight ? `${item.bike.seatHeight} mm` : 'N/A'} / ${item.bike.groundClearance ? `${item.bike.groundClearance} mm` : 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 8pt; color: #64748b; margin-top: 12px;">
          * Specifications and prices verified as of ${formattedDate}. Link to manufacturer: <a href="${item.bike.sourceUrl || '#'}" style="color: #0B1F3A;">${item.bike.sourceUrl || 'Official OEM Portal'}</a>
        </div>
      </div>

      <div class="footer-bar">
        <div>Bike for U &bull; www.bikeforu.in</div>
        <div>Page ${idx + 4} of ${topBikes.length + 4}</div>
      </div>
    </div>
  `
    )
    .join('')}

  <!-- ==================== PAGE 9: METHODOLOGY, DISCLAIMER & NEXT STEPS ==================== -->
  <div class="page">
    <div class="header-bar">
      <div class="brand-logo">BIKE<span>4</span>U</div>
      <div class="report-meta-tag">Methodology & Next Steps &bull; ${data.reportId}</div>
    </div>

    <div class="content-body">
      <h2>Methodology & Transparency</h2>
      <p style="font-size: 9.5pt; color: #334155; margin-bottom: 12px;">
        Bike for U recommendations are generated using a <strong>fully deterministic mathematical engine</strong>. There is zero paid placement, brand sponsorship, or black-box machine learning biasing your shortlist.
      </p>

      <div style="background: #F3F5F9; padding: 12px; border-radius: 6px; font-size: 9pt; margin-bottom: 16px;">
        <strong>Scoring Distribution:</strong><br>
        &bull; <strong>Features (25%):</strong> Strict proportion of requested safety and comfort amenities satisfied.<br>
        &bull; <strong>Segment (20%):</strong> 100 for exact riding category; 50 for closely adjacent ergonomic types.<br>
        &bull; <strong>Budget (20%):</strong> 100 inside your stated range; down-weighted smoothly up to 115% cap.<br>
        &bull; <strong>Mileage / Range (20%):</strong> Evaluated against requested minimum with rewards for higher efficiency.<br>
        &bull; <strong>Styling (15%):</strong> Evaluated against primary and secondary visual design classifications.
      </div>

      <h2>Your Showroom Next Steps</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 9pt; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
          <strong style="color: #0B1F3A;">Test Ride Checklist</strong>
          <ul style="padding-left: 16px; margin-top: 6px; line-height: 1.6;">
            <li>Sit on the vehicle with both feet down to evaluate flat-footing comfort.</li>
            <li>Test low-speed U-turns to inspect front-end weight distribution.</li>
            <li>Take a pillion rider along to check rear shock compression and comfort.</li>
            <li>Test braking firmly on clean pavement to evaluate ABS trigger feedback.</li>
          </ul>
        </div>
        <div style="border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
          <strong style="color: #0B1F3A;">Dealer Discussion Tips</strong>
          <ul style="padding-left: 16px; margin-top: 6px; line-height: 1.6;">
            <li>Ask for an itemised on-road quote (RTO registration, insurance, handling).</li>
            <li>Opt out of mandatory accessories or handling charges if unnecessary.</li>
            <li>Compare insurance quotes from third-party aggregators vs dealer package.</li>
            <li>Confirm battery warranty terms and charger inclusion for electric models.</li>
          </ul>
        </div>
      </div>

      <h2>Disclaimer</h2>
      <p style="font-size: 8.5pt; color: #64748b; line-height: 1.5;">
        All motorcycle and scooter prices quoted are ex-showroom reference figures and indicative only. Final on-road prices, road tax, insurance, and accessory charges vary by state, municipal district, and individual dealership. Bike for U does not sell vehicles, accept dealer booking payments, or guarantee vehicle availability.
      </p>

      <div style="margin-top: 16px; padding: 12px; background: #fff7ed; border-radius: 6px; border: 1px solid #ffedd5; font-size: 8.5pt; color: #9a3412;">
        <strong>Coming Soon to Bike for U:</strong> Live EMI calculator with low-interest partner terms, pincode-based authorized dealer locator, and side-by-side comparison tools.
      </div>
    </div>

    <div class="footer-bar">
      <div>Bike for U &bull; Report ${data.reportId} &bull; Generated for consumer personal use</div>
      <div>Page ${topBikes.length + 4} of ${topBikes.length + 4}</div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Generate PDF buffer using Puppeteer
 */
export async function generatePdfBuffer(reportData: ReportData): Promise<Buffer> {
  const html = await generateReportHtml(reportData);

  // Dynamic import of puppeteer to prevent startup issues
  const puppeteer = await import('puppeteer');

  // In Docker / Linux, launch with standard container arguments
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 15000,
    });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}
