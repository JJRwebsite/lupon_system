const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

// Generate PDF for complaint form (KP Form 7)
router.post('/generate-complaint', pdfController.generateComplaintPDF);

// Generate PDF for Notice of Hearing (KP Form 8)
router.post('/generate-notice-hearing', pdfController.generateNoticeOfHearingPDF);

// Generate PDF for Summons (KP Form 9)
router.post('/generate-summons', pdfController.generateSummonsPDF);

// Generate PDF for Settlement (KP Form 16)
router.post('/generate-settlement', pdfController.generateSettlementPDF);

// Generate PDF for Mediation Hearing (Minutes of Hearing)
router.post('/generate-mediation-hearing', pdfController.generateMediationHearingPDF);

// Generate PDF for Conciliation Hearing (Minutes of Hearing)
router.post('/generate-conciliation-hearing', pdfController.generateConciliationHearingPDF);

// Generate PDF for Arbitration Hearing (Minutes of Hearing)
router.post('/generate-arbitration-hearing', pdfController.generateArbitrationHearingPDF);

// Generate PDF for Certificate to File Action (KP Form 20-B)
router.post('/generate-cfa', pdfController.generateCFAPDF);

// Generate PDF for Notice for Constitution of Pangkat (KP Form 10)
router.post('/generate-notice-constitution-pangkat', pdfController.generateNoticeConstitutionPangkatPDF);

// Generate PDF for Notice to Choose Pangkat Member (KP Form 11)
router.post('/generate-notice-choose-pangkat', pdfController.generateNoticeChoosePangkatPDF);

module.exports = router;
