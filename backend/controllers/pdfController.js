const puppeteer = require('puppeteer');
const path = require('path');
const { getBarangayLogoHTML } = require('../utils/logo');

// Browser instance management for performance optimization
let browserInstance = null;
let browserPromise = null;

// Get or create browser instance with connection pooling
async function getBrowserInstance() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  
  if (browserPromise) {
    return browserPromise;
  }
  
  browserPromise = puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  browserInstance = await browserPromise;
  browserPromise = null;
  
  // Handle browser disconnection
  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });
  
  return browserInstance;
}

// Optimized PDF generation function
async function generatePDFFromHTML(html, options = {}) {
  let page = null;
  try {
    const browser = await getBrowserInstance();
    page = await browser.newPage();
    
    // Optimize page settings for faster rendering
    await page.setViewport({ width: 1024, height: 768 });
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded', // Faster than 'networkidle0'
      timeout: 10000 
    });
    
    const pdfOptions = {
      format: options.format || 'Legal',
      printBackground: true,
      preferCSSPageSize: true,
      margin: options.margin || {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      ...options
    };
    
    const pdf = await page.pdf(pdfOptions);
    return pdf;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Helper functions for date formatting
function parseDateString(dateStr) {
  if (!dateStr) return null;
  
  // If it's already a Date object, return it
  if (dateStr instanceof Date) {
    return dateStr;
  }
  
  // If it's a string, process it
  if (typeof dateStr === 'string') {
    return new Date(dateStr.replace(' ', 'T'));
  }
  
  // Try to convert to Date if it's something else
  return new Date(dateStr);
}

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatLongDate(dateStr) {
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString('default', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${suffix} day of ${month}, ${year}`;
}

function formatTime(dateStr) {
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mins = String(minutes).padStart(2, '0');
  return `${hours}:${mins} ${ampm}`;
}

// Generate HTML template for KP Form No. 8 - Notice of Hearing (Official Format)
function generateNoticeOfHearingHTML(noticeData) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form No. 8 - Notice of Hearing</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.75in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .form-number {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            gap: 15px;
        }
        
        .header-center {
            text-align: center;
            flex: 1;
        }
        
        .header-center h2 {
            margin: 5px 0;
            font-size: 14px;
            font-style: italic;
            text-decoration: underline;
            font-weight: normal;
        }
        
        .notice-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 30px 0 20px;
        }
        
        .to-section {
            margin-bottom: 20px;
            font-size: 12px;
        }
        
        .address-box {
            border: 1px solid #000;
            padding: 8px;
            margin: 8px 0;
            min-height: 60px;
            width: 200px;
        }
        
        .underline {
            border-bottom: 1px solid #000;
            min-width: 80px;
            display: inline-block;
            margin: 0 2px;
            padding: 1px 2px;
        }
        
        .underline-long {
            border-bottom: 1px solid #000;
            min-width: 150px;
            display: inline-block;
            margin: 0 2px;
            padding: 1px 2px;
        }
        
        .hearing-details {
            margin: 20px 0;
            line-height: 1.6;
            font-size: 12px;
        }
        
        .date-issued {
            margin: 20px 0;
            font-size: 12px;
        }
        
        .signature-section {
            margin-top: 40px;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 250px;
            height: 20px;
            margin: 15px auto 5px;
        }
        
        .notification-section {
            margin-top: 40px;
            font-size: 11px;
        }
        
        .complainant-info {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        
        .complainant-signature {
            text-align: center;
        }
        
        .complainant-signature .signature-line {
            width: 200px;
            margin: 10px auto 5px;
        }
    </style>
</head>
<body>
    <div class="form-number">KP Form No. 8</div>
    
    <div class="header">
        ${getBarangayLogoHTML()}
        <div class="header-center" style="margin: 0 90px; text-align: center;">
            <div style="font-size: 11px;">Republic of the Philippines</div>
            <div style="font-size: 11px;">Province of Cebu</div>
            <div style="font-size: 11px;">Municipality of Cordova</div>
            <div style="font-size: 11px; font-weight: bold;">BARANGAY IBABAO</div>
            <h2>Office of the Lupong Tagapamayapa</h2>
        </div>
    </div>
    
    <div class="notice-title">NOTICE OF HEARING</div>
    
    <div class="to-section">
        <div style="margin-bottom: 8px;"><strong>To:</strong> <span class="underline-long">${noticeData.respondent_name || ''}</span></div>
        <div class="address-box">
            ${noticeData.respondent_purok || 'Purok Maasgaon, Sitio Bantol'}<br/>
            ${noticeData.respondent_barangay || 'Ibabao, Cordova, Cebu'}
        </div>
    </div>
    
    <div class="hearing-details">
        <div style="margin-bottom: 15px;">
            You are hereby summoned to appear before me in person on the 
            <span class="underline">${formatOrdinalDate(noticeData.hearing_date)}</span> day of 
            <span class="underline">${formatMonth(noticeData.hearing_date)}</span>, 
            <span class="underline">${formatYear(noticeData.hearing_date)}</span>
        </div>
        <div>
            at <span class="underline">${formatTime12Hour(noticeData.hearing_time)}</span> 
            O'clock in the <span class="underline">${getTimeOfDay(noticeData.hearing_time)}</span> 
            for the hearing of your complaint.
        </div>
    </div>
    
    <div class="date-issued">
        This <span class="underline">${formatOrdinalDate(noticeData.notice_date || new Date())}</span> day of 
        <span class="underline">${formatMonth(noticeData.notice_date || new Date())}</span>, 
        <span class="underline">${formatYear(noticeData.notice_date || new Date())}</span> 
        at Ibabao, Cordova, Cebu
    </div>
    
    <div class="signature-section">
        <div class="signature-line"></div>
        <div style="font-weight: bold;">Hon. ATTY. ARTHUR L. DEGAMO</div>
        <div style="font-size: 11px;">Punong Barangay</div>
    </div>
    
    <div class="notification-section">
        <div style="margin-bottom: 15px;">
            Notified this <span class="underline">${formatOrdinalDate(noticeData.notification_date || noticeData.notice_date || new Date())}</span> 
            day of <span class="underline">${formatMonth(noticeData.notification_date || noticeData.notice_date || new Date())}</span>, 
            <span class="underline">${formatYear(noticeData.notification_date || noticeData.notice_date || new Date())}</span>.
        </div>
    </div>
    
    <div class="complainant-info">
        <div>
            <div style="margin-bottom: 20px;">Complainant/s</div>
            <div class="complainant-signature">
                <div class="signature-line"></div>
                <div style="font-weight: bold; font-size: 11px;">
                    ${noticeData.complainant_name || 'RESURECCION TITULAR'}
                </div>
            </div>
        </div>
        
        <div style="text-align: right;">
            <div>Date: <span class="underline" style="min-width: 100px;"></span></div>
            <div style="margin-top: 8px;">Time: <span class="underline" style="min-width: 100px;"></span></div>
        </div>
    </div>
</body>
</html>
  `;
}

// Helper functions for Notice of Hearing date formatting
function formatOrdinalDate(dateStr) {
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  const day = d.getDate();
  return `${day}${getOrdinalSuffix(day)}`;
}

function formatMonth(dateStr) {
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleString('default', { month: 'long' });
}

function formatYear(dateStr) {
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  return d.getFullYear();
}

function formatTime12Hour(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes}`;
}

function getTimeOfDay(timeStr) {
  if (!timeStr) return 'morning';
  const [hours] = timeStr.split(':');
  return parseInt(hours) >= 12 ? 'afternoon' : 'morning';
}

// Generate HTML template for KP Form 9 - Summons
function generateSummonsHTML(summonsData) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form 9 - Summons</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.5in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .header h3 {
            margin: 4px 0;
            font-weight: normal;
        }
        
        .case-info {
            display: flex;
            justify-content: space-between;
            margin: 16px 0;
        }
        
        .underline {
            border-bottom: 1px solid #000;
            min-width: 120px;
            display: inline-block;
            margin: 0 4px;
        }
        
        .underline-name {
            border-bottom: 1px solid #000;
            min-width: 200px;
            display: inline-block;
            margin: 0 4px;
        }
        
        .underline-short {
            border-bottom: 1px solid #000;
            min-width: 80px;
            display: inline-block;
            margin: 0 4px;
        }
        
        .underline-long {
            border-bottom: 1px solid #000;
            min-width: 300px;
            display: inline-block;
            margin: 0 4px;
        }
        
        .summons-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 32px 0 24px;
            letter-spacing: 2px;
        }
        
        .to-section {
            margin: 24px 0;
        }
        
        .summons-body {
            margin: 24px 0;
            line-height: 1.8;
        }
        
        .warning {
            margin: 16px 0;
            line-height: 1.8;
        }
        
        .signature-section {
            margin-top: 48px;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin: 16px auto 8px;
        }
        
        .officers-return {
            margin-top: 48px;
        }
        
        .officers-return h4 {
            text-align: center;
            font-weight: bold;
            margin-bottom: 16px;
        }
        
        .service-info {
            margin: 16px 0;
            line-height: 1.8;
        }
        
        .respondent-list {
            margin: 24px 0;
            min-height: 120px;
        }
        
        .process-server {
            text-align: right;
            margin-top: 32px;
        }
        
        .received-section {
            margin-top: 32px;
        }
        
        .signature-row {
            display: flex;
            justify-content: space-between;
            margin: 16px 0;
        }
    </style>
</head>
<body>
    <div class="form-number" style="position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: bold;">KP Form No. 9</div>
    
    <div class="header" style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; position: relative;">
        ${getBarangayLogoHTML()}
        <div style="text-align: center; flex: 1; margin: 0 90px;">
            <h3>Republic of the Philippines</h3>
            <h3>Province of Cebu</h3>
            <h3>Municipality of Cordova</h3>
            <h3>Barangay <span class="underline">${summonsData.barangay || 'Ibabao'}</span></h3>
            <h3 style="font-weight: bold;">OFFICE OF THE LUPONG TAGAPAMAYAPA</h3>
        </div>
    </div>
    
    <div class="case-info">
        <div>
            <span class="underline-name">${summonsData.complainant_name || ''}</span><br/>
            Complainant/s
        </div>
        <div>
            Barangay Case No.: <span class="underline">${summonsData.case_no || ''}</span><br/>
            For: <span class="underline-long">${summonsData.case_title || summonsData.case_nature || ''}</span>
        </div>
    </div>
    
    <div style="text-align: center; margin: 16px 0;">- against -</div>
    
    <div style="text-align: center; margin-bottom: 24px;">
        <span class="underline-name">${summonsData.respondent_name || ''}</span><br/>
        <span class="underline-name"></span><br/>
        Respondent/s
    </div>
    
    <div class="summons-title">S U M M O N S</div>
    
    <div class="to-section">
        <div style="margin-bottom: 8px;">TO: <span class="underline-name">${summonsData.respondent_name || ''}</span></div>
        <div style="margin-left: 24px; margin-bottom: 8px;">Purok: ${summonsData.respondent_purok || ''}</div>
        <div style="margin-left: 24px; margin-bottom: 8px;">Barangay: ${summonsData.respondent_barangay || ''}</div>
    </div>
    
    <div class="summons-body">
        <div style="margin-bottom: 16px;">
            You are hereby summoned to appear before me in person, together with your witnesses, on the
            <span class="underline-short">${formatOrdinalDate(summonsData.hearing_date)}</span> day of 
            <span class="underline">${formatMonth(summonsData.hearing_date)}</span>, 
            <span class="underline-short">${formatYear(summonsData.hearing_date)}</span>, at 
            <span class="underline-short">${formatTime12Hour(summonsData.hearing_time)}</span>o'clock in the 
            <span class="underline">${getTimeOfDay(summonsData.hearing_time)}</span>, then
        </div>
        <div>
            and there to answer to a complaint made before me, copy of which is attached hereto, for
            mediation/conciliation of your dispute with complainant/s.
        </div>
    </div>
    
    <div class="warning">
        You are hereby warned that if you refuse or willfully fail to appear in obedience to this summons,
        you may be barred from filing any counterclaim arising from said complaint.
    </div>
    
    <div style="margin: 16px 0; font-weight: bold;">
        FAIL NOT or else face punishment as for contempt of court.
    </div>
    
    <div style="margin: 24px 0;">
        This <span class="underline-short">${formatOrdinalDate(summonsData.summons_date)}</span> day of 
        <span class="underline">${formatMonth(summonsData.summons_date)}</span>, 
        <span class="underline-short">${formatYear(summonsData.summons_date)}</span>.
    </div>
    
    <div class="signature-section">
        <div class="signature-line"></div>
        <div style="font-weight: bold;">Hon. ATTY. ARTHUR L. DEGAMO</div>
        <div>Punong Barangay</div>
    </div>
    
    <div class="officers-return">
        <h4>OFFICER'S RETURN</h4>
        <div class="service-info">
            I served this summons upon respondent <span class="underline-name">${summonsData.respondent_name || ''}</span> on the 
            <span class="underline-long"></span> and upon respondent <span class="underline-name"></span> on the 
            <span class="underline-long"></span> and upon respondent <span class="underline-name"></span> on the 
            <span class="underline-long"></span> and upon respondent <span class="underline-name"></span> on the 
            <span class="underline-long"></span> and upon respondent <span class="underline-name"></span> on the 
            <span class="underline-long"></span>
        </div>
        
        <div style="margin: 16px 0;">
            By: (Write name/s/ of respondent/s before mode by which he/ they was/ were served.)
        </div>
        
        <div class="respondent-list">
            Respondents:
        </div>
        
        <div class="process-server">
            <div class="signature-line" style="width: 200px; margin: 16px 0;"></div>
            <div style="font-weight: bold;">VIRGIE ADOLFO</div>
            <div>Process Server</div>
        </div>
        
        <div class="received-section">
            <div style="margin-bottom: 16px;">Received by Respondent/s representative/s:</div>
            
            <div class="signature-row">
                <div>
                    <div class="signature-line" style="width: 200px; margin: 16px 0;"></div>
                    <div style="text-align: center;">Signature</div>
                </div>
                <div>
                    <div class="signature-line" style="width: 200px; margin: 16px 0;"></div>
                    <div style="text-align: center;">Date</div>
                    <div style="margin-top: 8px;">Time: <span class="underline" style="min-width: 100px;"></span></div>
                </div>
            </div>
            
            <div class="signature-row">
                <div>
                    <div class="signature-line" style="width: 200px; margin: 16px 0;"></div>
                    <div style="text-align: center;">Signature</div>
                </div>
                <div>
                    <div class="signature-line" style="width: 200px; margin: 16px 0;"></div>
                    <div style="text-align: center;">Date</div>
                    <div style="margin-top: 8px;">Time: <span class="underline" style="min-width: 100px;"></span></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate HTML template for the complaint form (KP Form 7)
function generateComplaintHTML(complaint) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form No. 7 - Complaint</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.75in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .form-number {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            gap: 15px;
        }
        
        .header-center {
            text-align: center;
            flex: 1;
        }
        
        .header-center h2 {
            margin: 8px 0;
            font-size: 16px;
            font-style: italic;
            text-decoration: underline;
        }
        
        .case-info-section {
            margin-bottom: 20px;
        }
        
        .case-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            align-items: flex-start;
        }
        
        .left-section {
            flex: 1;
            margin-right: 40px;
        }
        
        .right-section {
            width: 200px;
        }
        
        .field-group {
            margin-bottom: 15px;
        }
        
        .field-label {
            font-size: 11px;
            margin-bottom: 3px;
        }
        
        .field-lines {
            border-bottom: 1px solid #000;
            min-height: 18px;
            padding: 2px 0;
            margin-bottom: 8px;
        }
        
        .multiple-lines {
            border-bottom: 1px solid #000;
            min-height: 18px;
            padding: 2px 0;
            margin-bottom: 3px;
        }
        
        .against-text {
            text-align: center;
            margin: 15px 0;
            font-weight: bold;
        }
        
        .complaint-title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 25px 0 15px;
        }
        
        .complaint-text {
            margin-bottom: 10px;
            font-size: 11px;
            line-height: 1.3;
        }
        
        .content-area {
            min-height: 120px;
            border: none;
            margin: 10px 0;
        }
        
        .content-lines {
            border-bottom: 1px solid #000;
            min-height: 16px;
            margin-bottom: 2px;
            padding: 1px 0;
        }
        
        .relief-section {
            margin-top: 20px;
        }
        
        .relief-text {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 11px;
        }
        
        .signature-section {
            margin-top: 30px;
        }
        
        .made-this {
            margin-bottom: 20px;
        }
        
        .complainant-signature {
            margin-bottom: 25px;
        }
        
        .received-section {
            margin-bottom: 20px;
        }
        
        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 25px;
        }
        

        
        .official-signature {
            text-align: center;
            width: 250px;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            height: 20px;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="form-number">KP Form No. 7</div>
    
    <div class="header">
        ${getBarangayLogoHTML()}
        <div class="header-center" style="margin: 0 90px; text-align: center;">
            <div style="font-weight: bold;">Republic of the Philippines</div>
            <div>Province of Cebu</div>
            <div>Municipality of Cordova</div>
            <div style="font-weight: bold;">BARANGAY IBABAO</div>
            <h2>Office of the Lupong Tagapamayapa</h2>
        </div>
    </div>
    
    <div class="case-info-section">
        <div class="case-info-row">
            <div class="left-section">
                <div class="field-group">
                    <div class="field-label">Complainant/s</div>
                    <div class="field-lines">${complaint.complainants || ''}</div>
                    <div class="multiple-lines"></div>
                    <div class="multiple-lines"></div>
                </div>
            </div>
            <div class="right-section">
                <div class="field-group">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="margin-right: 10px;">Barangay Case No.:</span>
                        <div class="field-lines" style="flex: 1;">${complaint.case_no || '2025-'}</div>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span style="margin-right: 10px;">For:</span>
                        <div class="field-lines" style="flex: 1;">${complaint.case_title || ''}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="against-text">-against-</div>
        
        <div class="field-group">
            <div class="field-label">Respondent/s</div>
            <div class="field-lines">${complaint.respondents || ''}</div>
            <div class="multiple-lines"></div>
            <div class="multiple-lines"></div>
        </div>
    </div>
    
    <div class="complaint-title">COMPLAINT</div>
    
    <div class="complaint-text">
        I/WE hereby complaint against above named respondent/s for violating my/our rights and interests in the following manner:
    </div>
    
    <div class="content-area">
        <div class="content-lines">${complaint.case_description ? complaint.case_description.substring(0, 80) : ''}</div>
        <div class="content-lines">${complaint.case_description ? complaint.case_description.substring(80, 160) : ''}</div>
        <div class="content-lines">${complaint.case_description ? complaint.case_description.substring(160, 240) : ''}</div>
        <div class="content-lines">${complaint.case_description ? complaint.case_description.substring(240, 320) : ''}</div>
        <div class="content-lines">${complaint.case_description ? complaint.case_description.substring(320, 400) : ''}</div>
        <div class="content-lines"></div>
        <div class="content-lines"></div>
    </div>
    
    <div class="relief-section">
        <div class="relief-text">
            THEREFORE, I/WE pray that the following relief/s be granted to me/us in accordance with law and/or equity:
        </div>
        
        <div class="content-area">
            <div class="content-lines">${complaint.relief_description ? complaint.relief_description.substring(0, 80) : ''}</div>
            <div class="content-lines">${complaint.relief_description ? complaint.relief_description.substring(80, 160) : ''}</div>
            <div class="content-lines">${complaint.relief_description ? complaint.relief_description.substring(160, 240) : ''}</div>
            <div class="content-lines">${complaint.relief_description ? complaint.relief_description.substring(240, 320) : ''}</div>
            <div class="content-lines"></div>
            <div class="content-lines"></div>
        </div>
    </div>
    
    <div class="signature-section">
        <div class="made-this">
            Made this <span style="border-bottom: 1px solid #000; padding: 0 20px; margin: 0 5px;">${formatLongDate(complaint.date_filed).split(' day of ')[0] || ''}</span> day of <span style="border-bottom: 1px solid #000; padding: 0 30px; margin: 0 5px;">${formatLongDate(complaint.date_filed).split(' day of ')[1]?.split(',')[0] || ''}</span>, <span style="border-bottom: 1px solid #000; padding: 0 20px; margin: 0 5px;">${new Date(complaint.date_filed).getFullYear() || '2025'}</span>.
        </div>
        
        <div class="complainant-signature">
            <div class="field-label">Complainant/s</div>
            <div class="signature-line"></div>
            <div style="text-align: center; font-size: 11px;">${complaint.complainants || ''}</div>
        </div>
        
        <div class="received-section">
            Received and filed this <span style="border-bottom: 1px solid #000; padding: 0 15px; margin: 0 5px;">${formatLongDate(complaint.date_filed).split(' day of ')[0] || ''}</span> day of <span style="border-bottom: 1px solid #000; padding: 0 25px; margin: 0 5px;">${formatLongDate(complaint.date_filed).split(' day of ')[1]?.split(',')[0] || ''}</span>, <span style="border-bottom: 1px solid #000; padding: 0 15px; margin: 0 5px;">${new Date(complaint.date_filed).getFullYear() || '2025'}</span>.<br/>
            Time: <span style="border-bottom: 1px solid #000; padding: 0 30px; margin: 0 5px;">${formatTime(complaint.date_filed) || ''}</span>
        </div>
        
        <div class="bottom-section">
            <div class="official-signature">
                <div class="signature-line"></div>
                <div style="font-weight: bold;">ATTY. ARTHUR L. DEGAMO</div>
                <div style="font-size: 11px;">Punong Barangay/Pangkat Chairman</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate PDF using Puppeteer
const generateComplaintPDF = async (req, res) => {
  try {
    const { complaint, complaintId } = req.body;
    let complaintData = complaint;
    
    // If complaintId is provided instead of full complaint object, fetch from database
    if (!complaint && complaintId) {
      const connectDB = require('../config/db');
      const connection = await connectDB();
      
      try {
        console.log('🔍 Fetching complaint data for ID:', complaintId);
        
        // Fetch complaint with resident details
        const [complaints] = await connection.execute(`
          SELECT c.*, 
                 comp.name as complainant_name,
                 resp.name as respondent_name,
                 wit.name as witness_name
          FROM complaints c
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE c.id = ?
        `, [complaintId]);
        
        console.log('📊 Database query result:', { 
          complaintsFound: complaints.length,
          complaintId: complaintId
        });
        
        if (complaints.length === 0) {
          console.log('❌ No complaint found for ID:', complaintId);
          await connection.end();
          return res.status(404).json({ error: 'Complaint not found' });
        }
        
        const dbComplaint = complaints[0];
        
        console.log('📋 Raw complaint data from DB:', {
          id: dbComplaint.id,
          complainant_name: dbComplaint.complainant_name,
          respondent_name: dbComplaint.respondent_name,
          case_title: dbComplaint.case_title
        });
        
        // Format complaint data for PDF generation
        complaintData = {
          case_no: String(dbComplaint.id),
          complainants: dbComplaint.complainant_name || 'N/A',
          respondents: dbComplaint.respondent_name || 'N/A',
          witness: dbComplaint.witness_name || '',
          date_filed: dbComplaint.date_filed,
          case_description: dbComplaint.case_description || dbComplaint.case_title || '',
          relief_description: dbComplaint.relief_description || '',
          case_title: dbComplaint.case_title || '',
          nature_of_case: dbComplaint.nature_of_case || ''
        };
        
        console.log('✅ Formatted complaint data for PDF:', complaintData);
        
        await connection.end();
      } catch (dbError) {
        await connection.end();
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Failed to fetch complaint data' });
      }
    }
    
    if (!complaintData) {
      console.log('❌ No complaint data available');
      return res.status(400).json({ error: 'Complaint data or complaintId is required' });
    }

    console.log('📝 Generating HTML content...');
    // Generate HTML content
    const htmlContent = generateComplaintHTML(complaintData);
    console.log('✅ HTML content generated successfully, length:', htmlContent.length);

    console.log('📝 Generating PDF from HTML...');
    // Use optimized PDF generation
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      format: 'Legal',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    console.log('📤 Sending PDF response...');
    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-7-${complaintData.case_no || 'complaint'}.pdf"`);
    res.send(pdfBuffer);
    console.log('✅ PDF response sent successfully');

  } catch (error) {
    console.error('❌ Error generating PDF:', {
      message: error.message,
      stack: error.stack,
      complaintId: req.body.complaintId,
      hasComplaint: !!req.body.complaint
    });
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Generate PDF for Notice of Hearing (KP Form 8)
const generateNoticeOfHearingPDF = async (req, res) => {
  try {
    const { noticeData } = req.body;
    
    if (!noticeData) {
      return res.status(400).json({ error: 'Notice data is required' });
    }

    // Generate HTML content for Notice of Hearing
    const htmlContent = generateNoticeOfHearingHTML(noticeData);
    
    // Use optimized PDF generation
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      format: 'Legal',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-8-Notice-${noticeData.case_no || 'hearing'}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating Notice of Hearing PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Generate PDF for Summons (KP Form 9)
const generateSummonsPDF = async (req, res) => {
  try {
    const { summonsData } = req.body;
    
    if (!summonsData) {
      return res.status(400).json({ error: 'Summons data is required' });
    }

    // Generate HTML content for Summons
    const htmlContent = generateSummonsHTML(summonsData);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF with long bond paper size
    const pdfBuffer = await page.pdf({
      format: 'Legal', // 8.5" x 14" (closest to long bond)
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      preferCSSPageSize: false
    });
    
    await browser.close();
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-9-Summons-${summonsData.case_no || 'summons'}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating Summons PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Generate HTML template for KP Form 16 - Amicable Settlement
function generateSettlementHTML(settlement) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form 16 - Amicable Settlement</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.5in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 24px;
            position: relative;
        }
        
        .header .form-number {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 10px;
        }
        
        .header-center {
            flex: 1;
            text-align: center;
        }
        
        .header .republic {
            font-size: 12px;
            margin-bottom: 4px;
        }
        
        .header .location {
            font-size: 10px;
            margin-bottom: 2px;
        }
        
        .header .office-title {
            font-size: 16px;
            font-weight: bold;
            font-style: italic;
            margin-top: 8px;
        }
        
        .case-info {
            margin-bottom: 24px;
        }
        
        .case-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        
        .case-left {
            width: 50%;
        }
        
        .case-right {
            width: 50%;
            padding-left: 32px;
        }
        
        .underline {
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin-bottom: 8px;
            min-height: 16px;
        }
        
        .case-number {
            text-align: right;
            margin-bottom: 8px;
        }
        
        .settlement-content {
            margin-bottom: 24px;
        }
        
        .settlement-title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 16px;
            font-size: 12px;
        }
        
        .agreement-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        
        .agreement-number {
            font-size: 10px;
            margin-right: 8px;
        }
        
        .agreement-text {
            flex: 1;
            font-size: 10px;
            line-height: 1.6;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            height: 64px;
            margin-bottom: 8px;
        }
        
        .signature-label {
            font-size: 10px;
            font-weight: bold;
        }
        
        .attestation {
            margin-bottom: 24px;
        }
        
        .attestation-title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 16px;
            font-size: 12px;
        }
        
        .attestation-text {
            font-size: 10px;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        
        .punong-barangay {
            text-align: center;
            margin-top: 48px;
        }
        
        .pb-signature {
            border-bottom: 1px solid #000;
            width: 256px;
            margin: 0 auto;
            height: 64px;
            margin-bottom: 8px;
        }
        
        .pb-name {
            font-size: 10px;
            font-weight: bold;
        }
        
        .pb-title {
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="form-number">KP Form 16</div>
        ${getBarangayLogoHTML()}
        <div class="header-center" style="margin: 0 90px; text-align: center;">
            <div class="republic">Republic of the Philippines</div>
            <div class="location">Province of Cebu</div>
            <div class="location">Municipality of Cordova</div>
            <div class="location">BARANGAY IBABAO</div>
            <h1 class="office-title">Office of the Lupong Tagapamayapa</h1>
        </div>
    </div>

    <div class="case-info">
        <div class="case-row">
            <div class="case-left">
                <div class="underline" style="font-weight: bold; font-size: 10px;">${settlement.complainants || 'COMPLAINANT NAME'}</div>
                <div class="underline" style="font-size: 10px;">Complainant/s</div>
            </div>
            <div class="case-right">
                <div class="case-number">
                    <span style="font-size: 10px;">Barangay Case No: </span>
                    <span style="border-bottom: 1px solid #000; padding: 0 8px;">${settlement.case_no}</span>
                </div>
                <div class="case-number">
                    <span style="font-size: 10px;">For: </span>
                    <span style="border-bottom: 1px solid #000; padding: 0 8px;">${settlement.case_title || 'AMICABLE SETTLEMENT'}</span>
                </div>
                <div class="case-number">
                    <span style="font-size: 10px;">against</span>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 16px;">
            <div class="underline" style="font-weight: bold; font-size: 10px;">${settlement.respondents || 'RESPONDENT NAME'}</div>
            <div class="underline" style="font-size: 10px;">Respondent/s</div>
        </div>
    </div>

    <div class="settlement-content">
        <h2 class="settlement-title">AMICABLE SETTLEMENT</h2>
        <p style="font-size: 10px; line-height: 1.6; margin-bottom: 16px;">
            We, complainant/s and respondent/s in the above-mentioned case, do hereby agree to settle our dispute as follows:
        </p>
        
        <div style="margin-bottom: 24px;">
            <div class="agreement-item">
                <span class="agreement-number">1.</span>
                <div class="agreement-text">
                    ${settlement.agreements || 'Settlement terms and conditions will be detailed here based on the specific case agreement.'}
                </div>
            </div>
        </div>

        <p style="font-size: 10px; line-height: 1.6; margin-bottom: 24px;">
            And bind ourselves to comply honestly and faithfully with the above terms of settlement. Entered into this 
            <span style="border-bottom: 1px solid #000; padding: 0 8px; margin: 0 4px;">${formatDate(settlement.settlement_date).split(',')[0]}</span> 
            day of <span style="border-bottom: 1px solid #000; padding: 0 8px; margin: 0 4px;">${formatDate(settlement.settlement_date).split(' ')[0]}</span> 
            <span style="border-bottom: 1px solid #000; padding: 0 8px; margin: 0 4px;">${new Date(settlement.settlement_date).getFullYear()}</span> 
            at Ibabao, Cordova, Cebu, Philippines.
        </p>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Complainant/s</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Respondent/s</div>
        </div>
    </div>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">${settlement.complainants || 'COMPLAINANT NAME'}</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">${settlement.respondents || 'RESPONDENT NAME'}</div>
        </div>
    </div>

    <div class="attestation">
        <h3 class="attestation-title">ATTESTATION</h3>
        <p class="attestation-text">
            I hereby certify that the foregoing amicable settlement was entered into by the parties freely and voluntarily, after I had explained to them the nature and consequences of such settlement.
        </p>
        
        <div class="punong-barangay">
            <div class="pb-signature"></div>
            <div class="pb-name">ATTY. ARTHUR L. DEGAMO</div>
            <div class="pb-title">Punong Barangay</div>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate HTML template for Mediation Hearing (Minutes of Hearing)
function generateMediationHearingHTML(mediationData) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Minutes of Hearing - Mediation</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.75in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            gap: 15px;
        }
        
        .header-center {
            text-align: center;
            flex: 1;
        }
        
        .header-center h3 {
            margin: 8px 0;
            font-size: 14px;
        }
        
        .office-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            font-style: italic;
        }
        
        .case-info {
            margin-bottom: 20px;
        }
        
        .case-info-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .case-info-label {
            width: 120px;
            font-weight: bold;
        }
        
        .underline {
            border-bottom: 1px solid #000;
            min-width: 200px;
            display: inline-block;
            padding: 2px 8px;
            margin: 0 4px;
        }
        
        .minutes-title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 24px 0 16px;
        }
        
        .minutes-content {
            margin: 16px 0;
            min-height: 300px;
            border: 1px solid #ccc;
            padding: 12px;
            white-space: pre-wrap;
        }
        
        .attendees {
            margin: 20px 0;
        }
        
        .attendees-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        
        .attendee-section {
            flex: 1;
            margin: 0 10px;
        }
        
        .attendee-label {
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            height: 20px;
            margin-bottom: 4px;
        }
        
        .name-line {
            text-align: center;
            font-size: 11px;
        }
        
        .lupon-section {
            margin-top: 30px;
            text-align: center;
        }
        
        .lupon-signature {
            margin: 20px auto;
            width: 250px;
        }
        
        .lupon-title {
            font-size: 11px;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="width: 70px; height: 70px; border: 2px solid #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; text-align: center; background-color: #f5f5f5;">
            BARANGAY<br/>LOGO
        </div>
        <div class="header-center">
            <div style="font-weight: bold;">Republic of the Philippines</div>
            <div>Province of Cebu</div>
            <div>MUNICIPALITY OF CORDOVA</div>
            <h3>BARANGAY IBABAO</h3>
        </div>
    </div>

    <div class="office-title">
        Office of the Lupon Tagapamayapa
    </div>

    <div class="case-info">
        <div class="case-info-row">
            <span class="case-info-label">COMPLAINANT:</span>
            <span class="underline">${mediationData.complainant || ''}</span>
        </div>
        <div class="case-info-row">
            <span class="case-info-label">vs.</span>
        </div>
        <div class="case-info-row">
            <span class="case-info-label">RESPONDENT:</span>
            <span class="underline">${mediationData.respondent || ''}</span>
        </div>
        <div class="case-info-row">
            <span class="case-info-label">For:</span>
            <span class="underline">${mediationData.case_title || 'MEDIATION'}</span>
        </div>
        <div class="case-info-row">
            <span class="case-info-label">Case No.:</span>
            <span class="underline">${mediationData.case_no || mediationData.complaint_id || ''}</span>
        </div>
    </div>

    <div class="minutes-title">
        MINUTES OF HEARING
    </div>

    <div class="case-info-row">
        <span style="margin-right: 20px;">${formatDate(mediationData.schedule_date)} ${formatTime(mediationData.schedule_time)}</span>
    </div>

    <div class="minutes-content">
${mediationData.mediation_minutes || 'Minutes of the mediation hearing will be recorded here during the session.'}
    </div>

    <div class="attendees">
        <div class="attendees-row">
            <div class="attendee-section">
                <div class="attendee-label">COMPLAINANT</div>
                <div class="signature-line"></div>
                <div class="name-line">${mediationData.complainant || 'COMPLAINANT NAME'}</div>
            </div>
            <div class="attendee-section">
                <div class="attendee-label">RESPONDENT</div>
                <div class="signature-line"></div>
                <div class="name-line">${mediationData.respondent || 'RESPONDENT NAME'}</div>
            </div>
        </div>
    </div>

    <div class="attendees">
        <div class="attendees-row">
            <div class="attendee-section">
                <div class="attendee-label">WITNESS</div>
                <div class="signature-line"></div>
                <div class="name-line">${mediationData.witness || 'WITNESS NAME'}</div>
            </div>
            <div class="attendee-section">
                <div class="attendee-label">LUPON CHAIRMAN</div>
                <div class="signature-line"></div>
                <div class="name-line">HON. ARTHUR L. DEGAMO</div>
                <div class="lupon-title">Lupon Chairman</div>
            </div>
        </div>
    </div>

    <div class="lupon-section">
        <div style="margin: 30px 0; font-weight: bold;">LUPON MEMBERS:</div>
        <div style="display: flex; justify-content: space-between; margin: 20px 0;">
            <div style="flex: 1; margin: 0 10px;">
                <div class="signature-line"></div>
                <div class="name-line">RAJSHEL P. PAURILLO</div>
            </div>
            <div style="flex: 1; margin: 0 10px;">
                <div class="signature-line"></div>
                <div class="name-line">JOHNRICH WILMAR INOC</div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 20px 0;">
            <div style="flex: 1; margin: 0 10px;">
                <div class="signature-line"></div>
                <div class="name-line">TESIES S. CABALLOS</div>
            </div>
            <div style="flex: 1; margin: 0 10px;">
                <div class="signature-line"></div>
                <div class="name-line">HON. ARTHUR L. DEGAMO</div>
                <div class="lupon-title">Lupon Chairman</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate PDF for Mediation Hearing (Minutes of Hearing)
async function generateMediationHearingPDF(req, res) {
  try {
    const { mediationData } = req.body;
    
    if (!mediationData) {
      return res.status(400).json({ error: 'Mediation data is required' });
    }

    const html = generateMediationHearingHTML(mediationData);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'Legal',
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Mediation-Hearing-${mediationData.case_no || mediationData.complaint_id || 'Form'}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating mediation hearing PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

// Generate PDF for Settlement (KP Form 16)
async function generateSettlementPDF(req, res) {
  try {
    const { settlement } = req.body;
    
    if (!settlement) {
      return res.status(400).json({ error: 'Settlement data is required' });
    }

    const html = generateSettlementHTML(settlement);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'Legal',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-16-${settlement.case_no}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating settlement PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

// Generate PDF for Conciliation Hearing (Minutes of Hearing)
async function generateConciliationHearingPDF(req, res) {
  try {
    const { conciliationData } = req.body;
    
    if (!conciliationData) {
      return res.status(400).json({ error: 'Conciliation data is required' });
    }

    // Use the same HTML template as mediation but with conciliation data
    const html = generateMediationHearingHTML(conciliationData);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'Legal',
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Conciliation-Hearing-${conciliationData.case_no || conciliationData.complaint_id || 'Form'}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating conciliation hearing PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

// Generate PDF for Arbitration Hearing (Minutes of Hearing)
async function generateArbitrationHearingPDF(req, res) {
  try {
    const { arbitrationData } = req.body;
    
    if (!arbitrationData) {
      return res.status(400).json({ error: 'Arbitration data is required' });
    }

    // Use the same HTML template as mediation but with arbitration data
    const html = generateMediationHearingHTML(arbitrationData);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'Legal',
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Arbitration-Hearing-${arbitrationData.case_no || arbitrationData.complaint_id || 'Form'}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating arbitration hearing PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

// Generate HTML template for KP Form No. 20-B - Certificate to File Action
function generateCFAHTML(cfaData) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form No. 20-B - Certificate to File Action</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.75in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .form-number {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 10px;
            font-weight: bold;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header-line {
            margin: 2px 0;
            font-size: 11px;
        }
        
        .office-title {
            font-weight: bold;
            font-size: 12px;
            margin: 15px 0;
        }
        
        .case-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
        }
        
        .complainant-section {
            width: 45%;
        }
        
        .case-number-section {
            width: 45%;
            text-align: right;
        }
        
        .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            text-align: center;
            margin: 0 5px;
        }
        
        .short-underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 100px;
            text-align: center;
            margin: 0 5px;
        }
        
        .against {
            text-align: center;
            margin: 10px 0;
            font-style: italic;
        }
        
        .respondent-section {
            text-align: center;
            margin: 10px 0;
        }
        
        .certification-title {
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            margin: 30px 0 20px 0;
        }
        
        .certification-content {
            margin: 20px 0;
            text-align: justify;
            line-height: 1.6;
        }
        
        .certification-item {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        .date-section {
            margin: 30px 0;
        }
        
        .signature-section {
            margin-top: 50px;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin: 20px auto;
            text-align: center;
            padding-top: 30px;
        }
        
        .signature-title {
            text-align: center;
            margin-top: 5px;
            font-size: 11px;
        }
        
        .attestation {
            margin-top: 40px;
        }
        
        .logo {
            width: 70px;
            height: 70px;
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .header-with-logo {
            margin-top: 80px;
        }
    </style>
</head>
<body>
    <div class="form-number">KP Form No. 20-B</div>
    
    ${getBarangayLogoHTML()}
    
    <div class="header header-with-logo">
        <div class="header-line">Republic of the Philippines</div>
        <div class="header-line">Province of Cebu</div>
        <div class="header-line">City of <span class="underline">Cordova</span></div>
        <div class="header-line">Barangay <span class="underline">Ibabao</span></div>
        <div class="header-line">-oOo-</div>
        <div class="office-title">OFFICE OF THE LUPONG TAGAPAMAYAPA</div>
    </div>
    
    <div class="case-info">
        <div class="complainant-section">
            <div class="underline">${cfaData.complainant || ''}</div>
            <div style="text-align: center; margin-top: 5px; font-size: 11px;">Complainant/s</div>
        </div>
        <div class="case-number-section">
            <div>Barangay Case No. <span class="underline">${cfaData.case_no || ''}</span></div>
            <div style="margin-top: 10px;">For: <span class="underline">${cfaData.case_title || ''}</span></div>
        </div>
    </div>
    
    <div class="against">-against-</div>
    
    <div class="respondent-section">
        <div class="underline">${cfaData.respondent || ''}</div>
        <div style="text-align: center; margin-top: 5px; font-size: 11px;">Respondent/s</div>
    </div>
    
    <div class="certification-title">CERTIFICATION TO FILE ACTION</div>
    
    <div class="certification-content">
        <div>This is to certify that:</div>
        
        <div class="certification-item">
            1. Parties were called for mediation of the complaint but the mediation proceeding did not result to any amicable settlement;
        </div>
        
        <div class="certification-item">
            2. The Punong Barangay set the meeting of the parties for the constitution of the Pangkat;
        </div>
        
        <div class="certification-item">
            3. The respondent willfully failed or refused to appear without justifiable reason at the conciliation proceedings before the Pangkat; and
        </div>
        
        <div class="certification-item">
            4. Therefore, the corresponding complaint for the dispute may now be filed in court/government office.
        </div>
    </div>
    
    <div class="date-section">
        Issued this <span class="short-underline">${formatOrdinalDate(cfaData.issued_date)}</span> day of <span class="short-underline">${formatMonth(cfaData.issued_date)}</span>, <span class="short-underline">${formatYear(cfaData.issued_date)}</span>.
    </div>
    
    <div class="signature-section">
        <div class="signature-line">TESSIE B. CABALHUG</div>
        <div class="signature-title">Pangkat Secretary</div>
        
        <div class="attestation">
            <div>Attested by:</div>
            <div class="signature-line">HON. ATTY. ARTHUR L. DEGAMO</div>
            <div class="signature-title">Pangkat Chairman</div>
        </div>
    </div>
</body>
</html>
`;
}

// Generate PDF for Certificate to File Action (KP Form 20-B)
async function generateCFAPDF(req, res) {
  try {
    const { complaint, complaintId } = req.body;
    let complaintData = complaint;
    
    // If complaintId is provided instead of full complaint object, fetch from database
    if (!complaint && complaintId) {
      const connectDB = require('../config/db');
      const connection = await connectDB();
      
      try {
        console.log('🔍 Fetching complaint data for CFA, ID:', complaintId);
        
        // Fetch complaint with resident details
        const [complaints] = await connection.execute(`
          SELECT c.*, 
                 TRIM(CONCAT(UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
                   CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END)) AS complainant_name,
                 comp.purok as complainant_purok,
                 comp.barangay as complainant_barangay,
                 TRIM(CONCAT(UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
                   CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END)) AS respondent_name,
                 resp.purok as respondent_purok,
                 resp.barangay as respondent_barangay
          FROM complaints c
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          WHERE c.id = ?
        `, [complaintId]);
        
        if (complaints.length === 0) {
          await connection.end();
          return res.status(404).json({ error: 'Complaint not found' });
        }
        
        const dbComplaint = complaints[0];
        
        // Format complaint data for CFA PDF generation
        complaintData = {
          case_no: String(dbComplaint.id),
          complainant: dbComplaint.complainant_name || 'N/A',
          respondent: dbComplaint.respondent_name || 'N/A',
          case_title: dbComplaint.case_title || '',
          issued_date: new Date() // Current date for CFA issuance
        };
        
        await connection.end();
      } catch (dbError) {
        await connection.end();
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Failed to fetch complaint data' });
      }
    }
    
    if (!complaintData) {
      return res.status(400).json({ error: 'Complaint data or complaintId is required' });
    }

    console.log('📝 Generating CFA HTML content...');
    // Generate HTML content
    const htmlContent = generateCFAHTML(complaintData);
    console.log('✅ CFA HTML content generated successfully');

    console.log('📝 Generating CFA PDF from HTML...');
    // Use optimized PDF generation
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      format: 'Legal',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      }
    });
    console.log('✅ CFA PDF generated successfully');

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-20B-CFA-${complaintData.case_no || 'certificate'}.pdf"`);
    res.send(pdfBuffer);
    console.log('✅ CFA PDF response sent successfully');

  } catch (error) {
    console.error('❌ Error generating CFA PDF:', {
      message: error.message,
      stack: error.stack,
      complaintId: req.body.complaintId,
      hasComplaint: !!req.body.complaint
    });
    res.status(500).json({ 
      error: 'Failed to generate CFA PDF',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Generate HTML template for KP Form No. 10 - Notice for Constitution of Pangkat
function generateNoticeConstitutionPangkatHTML(noticeData) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form No. 10 - Notice for Constitution of Pangkat</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.75in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .form-number {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 10px;
            font-weight: bold;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header-line {
            margin: 2px 0;
            font-size: 11px;
        }
        
        .municipality {
            font-weight: bold;
            font-size: 12px;
            margin: 10px 0;
        }
        
        .barangay {
            margin: 5px 0;
        }
        
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 40px 0 30px 0;
        }
        
        .to-section {
            margin: 20px 0;
        }
        
        .underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 150px;
            text-align: center;
            margin: 0 5px;
        }
        
        .long-underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            text-align: center;
            margin: 0 5px;
        }
        
        .short-underline {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 50px;
            text-align: center;
            margin: 0 5px;
        }
        
        .party-labels {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 10px;
            text-align: center;
        }
        
        .content {
            margin: 30px 0;
            text-align: justify;
            line-height: 1.6;
        }
        
        .date-section {
            margin: 30px 0;
        }
        
        .signature-section {
            margin-top: 50px;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 250px;
            margin: 20px auto;
            text-align: center;
            padding-top: 30px;
        }
        
        .signature-title {
            text-align: center;
            margin-top: 5px;
            font-size: 11px;
        }
        
        .notification-section {
            margin-top: 40px;
        }
        
        .notification-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
        }
        
        .notification-signature {
            width: 45%;
            text-align: center;
        }
        
        .notification-signature-line {
            border-bottom: 1px solid #000;
            margin: 20px 0 5px 0;
            padding-top: 20px;
        }
        
        .logo {
            width: 70px;
            height: 70px;
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .header-with-logo {
            margin-top: 80px;
        }
    </style>
</head>
<body>
    <div class="form-number">KP Form No. 10</div>
    
    ${getBarangayLogoHTML()}
    
    <div class="header header-with-logo">
        <div class="header-line">Republic of the Philippines</div>
        <div class="header-line">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</div>
        <div class="municipality">MUNICIPALITY OF <span class="underline">CORDOVA</span></div>
        <div class="barangay">Barangay <span class="underline">IBABAO</span></div>
    </div>
    
    <div class="title">NOTICE FOR CONSTITUTION OF PANGKAT</div>
    
    <div class="to-section">
        TO &nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;&nbsp;<span class="long-underline">${noticeData.complainant || ''}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="long-underline">${noticeData.respondent || ''}</span>
        <div class="party-labels">
            <div style="width: 45%; text-align: center;">Complainant/s</div>
            <div style="width: 45%; text-align: center;">Respondent/s</div>
        </div>
    </div>
    
    <div class="content">
        You are hereby required before me on the <span class="underline">${formatOrdinalDate(noticeData.conciliation_date)}</span> day of <span class="underline">${formatMonth(noticeData.conciliation_date)}</span>, <span class="short-underline">${formatYear(noticeData.conciliation_date)}</span>, at <span class="underline">${noticeData.conciliation_time || ''}</span> o'clock in the morning/afternoon for the constitution of Pangkat ng Tagapagkasundo which shall mediate your dispute. Should you fail to agree on the Pangkat membership or to appear on the aforesaid date for the constitution of the Pangkat, I shall determine the membership thereof by drawing lots.
    </div>
    
    <div class="date-section">
        This <span class="underline">${formatOrdinalDate(new Date())}</span> day of <span class="underline">${formatMonth(new Date())}</span>, <span class="short-underline">${formatYear(new Date())}</span>.
    </div>
    
    <div class="signature-section">
        <div class="signature-line">HON. ATTY. ARTHUR L. DEGAMO</div>
        <div class="signature-title">Punong Barangay</div>
    </div>
    
    <div class="notification-section">
        <div>Notified this <span class="short-underline">${formatOrdinalDate(new Date())}</span> day of <span class="underline">${formatMonth(new Date())}</span>, <span class="short-underline">${formatYear(new Date())}</span>.</div>
        
        <div class="notification-signatures">
            <div class="notification-signature">
                <div class="notification-signature-line"></div>
                <div>Complainant/s</div>
            </div>
            <div class="notification-signature">
                <div class="notification-signature-line"></div>
                <div>Respondent/s</div>
            </div>
        </div>
    </div>
</body>
</html>
`;
}

// Generate PDF for Notice for Constitution of Pangkat (KP Form No. 10)
async function generateNoticeConstitutionPangkatPDF(req, res) {
  try {
    const { complaint, complaintId } = req.body;
    let complaintData = complaint;
    
    // If complaintId is provided instead of full complaint object, fetch from database
    if (!complaint && complaintId) {
      const connectDB = require('../config/db');
      const connection = await connectDB();
      
      try {
        console.log('🔍 Fetching complaint data for Notice of Constitution of Pangkat, ID:', complaintId);
        
        // Fetch complaint with resident details and conciliation schedule
        const [complaints] = await connection.execute(`
          SELECT c.*, 
                 comp.name as complainant_name,
                 resp.name as respondent_name,
                 conc.date as conciliation_date,
                 conc.time as conciliation_time
          FROM complaints c
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN conciliation conc ON c.id = conc.complaint_id
          WHERE c.id = ?
          ORDER BY conc.created_at DESC
          LIMIT 1
        `, [complaintId]);
        
        if (complaints.length === 0) {
          await connection.end();
          return res.status(404).json({ error: 'Complaint not found' });
        }
        
        const dbComplaint = complaints[0];
        
        // Format complaint data for Notice PDF generation
        complaintData = {
          case_no: String(dbComplaint.id),
          complainant: dbComplaint.complainant_name || 'N/A',
          respondent: dbComplaint.respondent_name || 'N/A',
          case_title: dbComplaint.case_title || '',
          conciliation_date: dbComplaint.conciliation_date ? new Date(dbComplaint.conciliation_date) : new Date(),
          conciliation_time: dbComplaint.conciliation_time || '2:00 PM'
        };
        
        await connection.end();
      } catch (dbError) {
        await connection.end();
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Failed to fetch complaint data' });
      }
    }
    
    if (!complaintData) {
      return res.status(400).json({ error: 'Complaint data or complaintId is required' });
    }

    console.log('📝 Generating Notice for Constitution of Pangkat HTML content...');
    // Generate HTML content
    const htmlContent = generateNoticeConstitutionPangkatHTML(complaintData);
    console.log('✅ Notice HTML content generated successfully');

    console.log('📝 Generating Notice PDF from HTML...');
    // Use optimized PDF generation
    const pdfBuffer = await generatePDFFromHTML(htmlContent, {
      format: 'Legal',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      }
    });
    console.log('✅ Notice PDF generated successfully');

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-10-Notice-Constitution-Pangkat-${complaintData.case_no || 'notice'}.pdf"`);
    res.send(pdfBuffer);
    console.log('✅ Notice PDF response sent successfully');

  } catch (error) {
    console.error('❌ Error generating Notice for Constitution of Pangkat PDF:', {
      message: error.message,
      stack: error.stack,
      complaintId: req.body.complaintId,
      hasComplaint: !!req.body.complaint
    });
    res.status(500).json({ 
      error: 'Failed to generate Notice for Constitution of Pangkat PDF',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Generate HTML template for KP Form No. 11 - Notice to Choose Pangkat Member
function generateNoticeChoosePangkatHTML(noticeData) {
  const { 
    complainant = 'N/A', 
    respondent = 'N/A', 
    case_no = 'N/A',
    case_title = 'N/A',
    lupon_member = 'N/A',
    date_notified = new Date(),
    complainant_address = 'N/A',
    respondent_address = 'N/A'
  } = noticeData;

  // Format the date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (!d || isNaN(d.getTime())) return '';
    const day = d.getDate();
    const suffix = getOrdinalSuffix(day);
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${day}${suffix} day of ${month}, ${year}`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KP Form No. 11 - Notice to Choose Pangkat Member</title>
    <style>
        @page {
            size: 8.5in 13in;
            margin: 0.75in;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .form-number {
            position: absolute;
            top: 0;
            right: 20px;
            font-size: 10px;
            font-weight: bold;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .header-center {
            text-align: center;
            flex: 1;
            margin: 0 90px;
        }
        
        .logo {
            width: 70px;
            height: 70px;
            flex-shrink: 0;
        }
        
        .header-text {
            font-size: 11px;
            line-height: 1.2;
        }
        
        .office-title {
            font-size: 18px;
            font-weight: bold;
            font-style: italic;
            margin: 8px 0;
            text-decoration: underline;
        }
        
        .case-info {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            font-size: 11px;
        }
        
        .case-info-left {
            flex: 1;
        }
        
        .case-info-right {
            text-align: right;
            width: 200px;
        }
        
        .vs-section {
            text-align: center;
            margin: 10px 0;
            font-weight: bold;
        }
        
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 30px 0 20px 0;
            text-decoration: underline;
        }
        
        .content {
            margin: 20px 0;
            text-align: justify;
            line-height: 1.6;
        }
        
        .signature-section {
            margin-top: 60px;
            text-align: right;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            margin: 20px 0 5px auto;
            text-align: center;
        }
        
        .signature-title {
            text-align: center;
            font-size: 11px;
            margin-top: 5px;
        }
        
        .notification-section {
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 20px;
        }
        
        .notification-header {
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .notification-left {
            flex: 1;
        }
        
        .notification-right {
            width: 200px;
            text-align: center;
        }
        
        .date-line {
            border-bottom: 1px solid #000;
            margin: 5px 0;
            padding-bottom: 2px;
        }
        
        .time-line {
            border-bottom: 1px solid #000;
            margin: 5px 0;
            padding-bottom: 2px;
        }
        
        .underline {
            text-decoration: underline;
        }
        
        .bold {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="form-number">KP Form No. 11</div>
    
    <div class="header">
        ${getBarangayLogoHTML()}
        <div class="header-center">
            <div class="header-text">
                Republic of the Philippines<br>
                Province of Cebu<br>
                Municipality of Cordova<br>
                <strong>BARANGAY IBABAO</strong>
            </div>
            <div class="office-title">Office of the Punong Barangay</div>
        </div>
    </div>
    
    <div class="case-info">
        <div class="case-info-left">
            <div><strong>${complainant}</strong></div>
            <div>${complainant_address || 'N/A'}</div>
            <div style="margin-top: 15px;">Complainant/s</div>
        </div>
        <div class="case-info-right">
            <div>Barangay Case No.: <strong>${case_no}</strong></div>
            <div>For: <strong>${case_title}</strong></div>
        </div>
    </div>
    
    <div class="vs-section">against:</div>
    
    <div class="case-info">
        <div class="case-info-left">
            <div><strong>${respondent}</strong></div>
            <div>${respondent_address || 'N/A'}</div>
            <div style="margin-top: 15px;">Respondent/s</div>
        </div>
    </div>
    
    <div class="title">NOTICE TO CHOOSE PANGKAT MEMBER</div>
    
    <div class="content">
        <div style="margin-bottom: 20px;">
            <strong>TO:</strong> &nbsp;&nbsp;<span class="underline bold">${lupon_member}</span>
        </div>
        
        <div style="margin-bottom: 20px; text-align: justify;">
            Notice is hereby given that you have been chosen member of the <span class="underline bold">Pangkat ng Tagapagkasundo</span> to amicably conciliate the dispute between the parties in the above-entitled case.
        </div>
        
        <div style="text-align: right; margin-top: 60px;">
            <div style="margin-bottom: 40px;">
                <div class="signature-line"></div>
                <div class="signature-title"><strong>TESSIE B. CABALHUG</strong></div>
                <div class="signature-title">Lupon Secretary</div>
            </div>
        </div>
    </div>
    
    <div class="notification-section">
        <div class="notification-header">Notified this <span class="underline">${formatDate(date_notified)}</span></div>
        
        <div class="notification-content">
            <div class="notification-left"></div>
            <div class="notification-right">
                <div style="margin-bottom: 20px;">
                    <div class="signature-line"></div>
                    <div class="signature-title"><strong>${lupon_member}</strong></div>
                    <div class="signature-title">Date:</div>
                    <div class="date-line"></div>
                    <div class="signature-title">Time:</div>
                    <div class="time-line"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
}

// Generate PDF for Notice to Choose Pangkat Member (KP Form No. 11)
async function generateNoticeChoosePangkatPDF(req, res) {
  try {
    const { complaint, complaintId, luponMembers } = req.body;
    let complaintData = complaint;
    
    // If complaintId is provided instead of full complaint object, fetch from database
    if (!complaint && complaintId) {
      const connectDB = require('../config/db');
      const connection = await connectDB();
      
      try {
        console.log('🔍 Fetching complaint data for Notice to Choose Pangkat Member, ID:', complaintId);
        
        // Fetch complaint with resident details
        const [complaints] = await connection.execute(`
          SELECT c.*, 
                 comp.name as complainant_name,
                 comp.purok as complainant_purok,
                 comp.barangay as complainant_barangay,
                 resp.name as respondent_name,
                 resp.purok as respondent_purok,
                 resp.barangay as respondent_barangay
          FROM complaints c
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          WHERE c.id = ?
        `, [complaintId]);
        
        if (complaints.length === 0) {
          await connection.end();
          return res.status(404).json({ error: 'Complaint not found' });
        }
        
        const dbComplaint = complaints[0];
        
        // Format complaint data for Notice PDF generation
        complaintData = {
          case_no: String(dbComplaint.id),
          complainant: dbComplaint.complainant_name || 'N/A',
          respondent: dbComplaint.respondent_name || 'N/A',
          case_title: dbComplaint.case_title || '',
          complainant_address: `${dbComplaint.complainant_purok || 'N/A'}, ${dbComplaint.complainant_barangay || 'N/A'}`,
          respondent_address: `${dbComplaint.respondent_purok || 'N/A'}, ${dbComplaint.respondent_barangay || 'N/A'}`
        };
        
        await connection.end();
      } catch (dbError) {
        await connection.end();
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Failed to fetch complaint data' });
      }
    }
    
    if (!complaintData) {
      return res.status(400).json({ error: 'Complaint data or complaintId is required' });
    }

    if (!luponMembers || !Array.isArray(luponMembers) || luponMembers.length === 0) {
      return res.status(400).json({ error: 'Lupon members array is required' });
    }

    console.log('📝 Generating Notice to Choose Pangkat Member PDFs for', luponMembers.length, 'members...');
    
    // Generate individual PDFs for each Lupon member
    const pdfBuffers = [];
    
    for (let i = 0; i < luponMembers.length; i++) {
      const member = luponMembers[i];
      const memberName = typeof member === 'string' ? member : (member.name || member.display_name || 'N/A');
      
      console.log(`📝 Generating PDF for member ${i + 1}: ${memberName}`);
      
      // Prepare data for this specific member
      const memberNoticeData = {
        ...complaintData,
        lupon_member: memberName,
        date_notified: new Date()
      };
      
      // Generate HTML content for this member
      const htmlContent = generateNoticeChoosePangkatHTML(memberNoticeData);
      
      // Generate PDF for this member
      const pdfBuffer = await generatePDFFromHTML(htmlContent, {
        format: 'Legal',
        margin: {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in'
        }
      });
      
      pdfBuffers.push({
        memberName: memberName,
        buffer: pdfBuffer
      });
      
      console.log(`✅ PDF generated successfully for member: ${memberName}`);
    }

    // If only one member, send single PDF
    if (pdfBuffers.length === 1) {
      const singlePdf = pdfBuffers[0];
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="KP-Form-11-Notice-Choose-Pangkat-${singlePdf.memberName.replace(/[^a-zA-Z0-9]/g, '-')}-${complaintData.case_no || 'notice'}.pdf"`);
      res.send(singlePdf.buffer);
      console.log('✅ Single Notice PDF response sent successfully');
      return;
    }

    // For multiple members, we'll need to combine PDFs or send them as a zip
    // For now, let's send the first one and log that multiple were generated
    console.log(`📦 Generated ${pdfBuffers.length} PDFs for multiple Lupon members`);
    
    // Send the first PDF (you might want to implement PDF merging or zip creation here)
    const firstPdf = pdfBuffers[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="KP-Form-11-Notice-Choose-Pangkat-Multiple-Members-${complaintData.case_no || 'notice'}.pdf"`);
    res.send(firstPdf.buffer);
    console.log('✅ Multiple Notice PDFs generated - sent first PDF as response');

  } catch (error) {
    console.error('❌ Error generating Notice to Choose Pangkat Member PDF:', {
      message: error.message,
      stack: error.stack,
      complaintId: req.body.complaintId,
      hasComplaint: !!req.body.complaint,
      luponMembersCount: req.body.luponMembers?.length || 0
    });
    res.status(500).json({ 
      error: 'Failed to generate Notice to Choose Pangkat Member PDF',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  generateComplaintPDF,
  generateNoticeOfHearingPDF,
  generateSummonsPDF,
  generateSettlementPDF,
  generateMediationHearingPDF,
  generateConciliationHearingPDF,
  generateArbitrationHearingPDF,
  generateCFAPDF,
  generateNoticeConstitutionPangkatPDF,
  generateNoticeChoosePangkatPDF
};

