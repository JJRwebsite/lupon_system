const connectDB = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper function to get date range based on interval
const getDateRange = (intervalType, dateValue) => {
  const date = new Date(dateValue);
  let startDate, endDate;

  switch (intervalType) {
    case 'monthly':
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      startDate = new Date(date.getFullYear(), quarter * 3, 1);
      endDate = new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      break;
    case 'yearly':
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59);
  }

  return { startDate, endDate };
};

// Helper function to format date for filename
const formatDateForFilename = (intervalType, dateValue) => {
  const date = new Date(dateValue);
  
  switch (intervalType) {
    case 'monthly':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    case 'yearly':
      return `${date.getFullYear()}`;
    default:
      return date.toISOString().split('T')[0];
  }
};

// Get report data based on type and date range
const getReportData = async (reportType, startDate, endDate) => {
  const connection = await connectDB();
  let query = '';
  let data = [];

  try {
    switch (reportType) {
      case 'all':
        query = `
          SELECT 
            c.id,
            c.case_title,
            CONCAT(comp.lastname, ', ', comp.firstname, ' ', COALESCE(comp.middlename, '')) as complainant,
            CONCAT(resp.lastname, ', ', resp.firstname, ' ', COALESCE(resp.middlename, '')) as respondent,
            CONCAT(wit.lastname, ', ', wit.firstname, ' ', COALESCE(wit.middlename, '')) as witness,
            c.status,
            c.date_filed as date
          FROM complaints c
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE c.date_filed BETWEEN ? AND ?
          ORDER BY c.date_filed DESC
        `;
        break;

      case 'mediation':
        query = `
          SELECT 
            m.id,
            c.case_title,
            CONCAT(comp.lastname, ', ', comp.firstname, ' ', COALESCE(comp.middlename, '')) as complainant,
            CONCAT(resp.lastname, ', ', resp.firstname, ' ', COALESCE(resp.middlename, '')) as respondent,
            CONCAT(wit.lastname, ', ', wit.firstname, ' ', COALESCE(wit.middlename, '')) as witness,
            'mediation' as status,
            m.date,
            m.time
          FROM mediation m
          LEFT JOIN complaints c ON m.complaint_id = c.id
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE m.date BETWEEN ? AND ? AND m.is_deleted = 0
          ORDER BY m.date DESC
        `;
        break;

      case 'conciliation':
        query = `
          SELECT 
            con.id,
            c.case_title,
            CONCAT(comp.lastname, ', ', comp.firstname, ' ', COALESCE(comp.middlename, '')) as complainant,
            CONCAT(resp.lastname, ', ', resp.firstname, ' ', COALESCE(resp.middlename, '')) as respondent,
            CONCAT(wit.lastname, ', ', wit.firstname, ' ', COALESCE(wit.middlename, '')) as witness,
            'conciliation' as status,
            con.date,
            con.time
          FROM conciliation con
          LEFT JOIN complaints c ON con.complaint_id = c.id
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE con.date BETWEEN ? AND ?
          ORDER BY con.date DESC
        `;
        break;

      case 'arbitration':
        query = `
          SELECT 
            a.id,
            c.case_title,
            CONCAT(comp.lastname, ', ', comp.firstname, ' ', COALESCE(comp.middlename, '')) as complainant,
            CONCAT(resp.lastname, ', ', resp.firstname, ' ', COALESCE(resp.middlename, '')) as respondent,
            CONCAT(wit.lastname, ', ', wit.firstname, ' ', COALESCE(wit.middlename, '')) as witness,
            'arbitration' as status,
            a.date,
            a.time
          FROM arbitration a
          LEFT JOIN complaints c ON a.complaint_id = c.id
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE a.date BETWEEN ? AND ? AND a.is_deleted = 0
          ORDER BY a.date DESC
        `;
        break;

      case 'settlement':
        query = `
          SELECT 
            s.id,
            c.case_title,
            CONCAT(comp.lastname, ', ', comp.firstname, ' ', COALESCE(comp.middlename, '')) as complainant,
            CONCAT(resp.lastname, ', ', resp.firstname, ' ', COALESCE(resp.middlename, '')) as respondent,
            CONCAT(wit.lastname, ', ', wit.firstname, ' ', COALESCE(wit.middlename, '')) as witness,
            'settled' as status,
            s.settlement_date as date,
            s.settlement_type
          FROM settlement s
          LEFT JOIN complaints c ON s.complaint_id = c.id
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE s.settlement_date BETWEEN ? AND ?
          ORDER BY s.settlement_date DESC
        `;
        break;

      case 'withdrawn':
        query = `
          SELECT 
            c.id,
            c.case_title,
            CONCAT(comp.lastname, ', ', comp.firstname, ' ', COALESCE(comp.middlename, '')) as complainant,
            CONCAT(resp.lastname, ', ', resp.firstname, ' ', COALESCE(resp.middlename, '')) as respondent,
            CONCAT(wit.lastname, ', ', wit.firstname, ' ', COALESCE(wit.middlename, '')) as witness,
            c.status,
            c.date_withdrawn as date
          FROM complaints c
          LEFT JOIN residents comp ON c.complainant_id = comp.id
          LEFT JOIN residents resp ON c.respondent_id = resp.id
          LEFT JOIN residents wit ON c.witness_id = wit.id
          WHERE c.status = 'withdrawn' AND c.date_withdrawn BETWEEN ? AND ?
          ORDER BY c.date_withdrawn DESC
        `;
        break;

      default:
        throw new Error('Invalid report type');
    }

    const [results] = await connection.execute(query, [startDate, endDate]);
    data = results;

  } finally {
    await connection.end();
  }

  return data;
};

// Export report as Excel file
const exportReportAsExcel = async (req, res) => {
  try {
    const { reportType, intervalType, dateValue } = req.body;
    
    if (!reportType || !intervalType || !dateValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: reportType, intervalType, dateValue'
      });
    }

    const { startDate, endDate } = getDateRange(intervalType, dateValue);
    const data = await getReportData(reportType, startDate, endDate);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for the specified period'
      });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Define columns based on report type
    const columns = [
      { header: 'Case ID', key: 'id', width: 10 },
      { header: 'Case Title', key: 'case_title', width: 30 },
      { header: 'Complainant', key: 'complainant', width: 25 },
      { header: 'Respondent', key: 'respondent', width: 25 },
      { header: 'Witness', key: 'witness', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 15 }
    ];

    // Add specific columns for certain report types
    if (reportType === 'settlement') {
      columns.push({ header: 'Settlement Type', key: 'settlement_type', width: 15 });
    } else if (['mediation', 'conciliation', 'arbitration'].includes(reportType)) {
      columns.push({ header: 'Time', key: 'time', width: 10 });
    }

    worksheet.columns = columns;

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    data.forEach(row => {
      const formattedRow = {
        ...row,
        complainant: row.complainant || '—',
        respondent: row.respondent || '—',
        witness: row.witness || '—',
        date: row.date ? new Date(row.date).toLocaleDateString() : '—'
      };
      worksheet.addRow(formattedRow);
    });

    // Generate filename
    const dateStr = formatDateForFilename(intervalType, dateValue);
    const filename = `lupon_${reportType}_${intervalType}_${dateStr}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting Excel report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
};

// Export report as PDF file
const exportReportAsPDF = async (req, res) => {
  try {
    const { reportType, intervalType, dateValue } = req.body;
    
    if (!reportType || !intervalType || !dateValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: reportType, intervalType, dateValue'
      });
    }

    const { startDate, endDate } = getDateRange(intervalType, dateValue);
    const data = await getReportData(reportType, startDate, endDate);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for the specified period'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Generate filename
    const dateStr = formatDateForFilename(intervalType, dateValue);
    const filename = `lupon_${reportType}_${intervalType}_${dateStr}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(18).font('Helvetica-Bold').text('BARANGAY LUPON REPORT', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(`Report Type: ${reportType.toUpperCase()}`, { align: 'center' });
    doc.text(`Period: ${intervalType.toUpperCase()} - ${dateStr}`, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Add table headers
    const tableTop = doc.y;
    const itemCodeX = 50;
    const titleX = 100;
    const complainantX = 250;
    const respondentX = 350;
    const statusX = 450;
    const dateX = 500;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', itemCodeX, tableTop);
    doc.text('Case Title', titleX, tableTop);
    doc.text('Complainant', complainantX, tableTop);
    doc.text('Respondent', respondentX, tableTop);
    doc.text('Status', statusX, tableTop);
    doc.text('Date', dateX, tableTop);

    // Add data rows
    let currentY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    data.forEach((row, index) => {
      if (currentY > 700) { // Start new page if needed
        doc.addPage();
        currentY = 50;
      }

      doc.text(row.id || '—', itemCodeX, currentY);
      doc.text((row.case_title || '—').substring(0, 20), titleX, currentY);
      doc.text((row.complainant || '—').substring(0, 15), complainantX, currentY);
      doc.text((row.respondent || '—').substring(0, 15), respondentX, currentY);
      doc.text(row.status || '—', statusX, currentY);
      doc.text(row.date ? new Date(row.date).toLocaleDateString() : '—', dateX, currentY);

      currentY += 15;
    });

    // Add footer
    doc.fontSize(8).text(`Total Records: ${data.length}`, 50, doc.page.height - 50);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error exporting PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
};

module.exports = {
  exportReportAsExcel,
  exportReportAsPDF
};
