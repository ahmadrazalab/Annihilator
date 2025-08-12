const express = require('express');
const router = express.Router();
const mailpitService = require('../services/mailpitService');
const aiService = require('../services/aiService');
const reportGenerator = require('../report/reportGenerator');
const dailySummaryJob = require('../jobs/dailySummary');
const mailer = require('../email/mailer');

/**
 * GET /reports/generate/:date - Generate report for specific date
 */
router.get('/generate/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { format = 'html' } = req.query;
    
    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    console.log(`Generating report for ${date}...`);

    // Fetch alerts for the specified date
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const alerts = await mailpitService.fetchMessages(startDate, endDate);
    
    // Generate AI summary
    const summary = await aiService.summarizeAlerts(alerts);
    
    if (format === 'html') {
      const htmlReport = reportGenerator.generateHTMLReport(summary, alerts, targetDate);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlReport);
    } else if (format === 'json') {
      res.json({
        success: true,
        date,
        alertCount: alerts.length,
        summary,
        alerts
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Use "html" or "json"'
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /reports/send/:date - Generate and send report for specific date
 */
router.post('/send/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    console.log(`Generating and sending report for ${date}...`);

    // Use the daily summary job to generate and send
    const result = await dailySummaryJob.runManual(targetDate);
    
    res.json({
      success: true,
      message: `Report for ${date} generated and sent successfully`,
      result
    });
  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /reports/run-daily - Manually trigger daily summary job
 */
router.post('/run-daily', async (req, res) => {
  try {
    console.log('Manually triggering daily summary job...');
    
    const result = await dailySummaryJob.runManual();
    
    res.json({
      success: true,
      message: 'Daily summary job completed successfully',
      result
    });
  } catch (error) {
    console.error('Error running daily summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /reports/job-status - Get daily job status
 */
router.get('/job-status', (req, res) => {
  try {
    const status = dailySummaryJob.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /reports/test-email - Send test email
 */
router.post('/test-email', async (req, res) => {
  try {
    console.log('Sending test email...');
    
    const result = await mailer.sendTestEmail();
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
