const express = require('express');
const router = express.Router();
const mailpitService = require('../services/mailpitService');
const aiService = require('../services/aiService');
const reportGenerator = require('../report/reportGenerator');

/**
 * GET /alerts/today - Get today's alerts
 */
router.get('/today', async (req, res) => {
  try {
    console.log('Fetching today\'s alerts...');
    const alerts = await mailpitService.getTodayAlerts();
    
    res.json({
      success: true,
      count: alerts.length,
      date: new Date().toISOString().split('T')[0],
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching today\'s alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /alerts/yesterday - Get yesterday's alerts
 */
router.get('/yesterday', async (req, res) => {
  try {
    console.log('Fetching yesterday\'s alerts...');
    const alerts = await mailpitService.getYesterdayAlerts();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    res.json({
      success: true,
      count: alerts.length,
      date: yesterday.toISOString().split('T')[0],
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching yesterday\'s alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /alerts/range - Get alerts for date range
 */
router.get('/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'start and end date parameters are required (YYYY-MM-DD format)'
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Set time boundaries
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(`Fetching alerts from ${start} to ${end}...`);
    const alerts = await mailpitService.fetchMessages(startDate, endDate);
    
    res.json({
      success: true,
      count: alerts.length,
      dateRange: { start, end },
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts for date range:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /alerts/summarize - Generate summary for provided alerts
 */
router.post('/summarize', async (req, res) => {
  try {
    const { alerts, format = 'json' } = req.body;
    
    if (!alerts || !Array.isArray(alerts)) {
      return res.status(400).json({
        success: false,
        error: 'alerts array is required in request body'
      });
    }

    console.log(`Generating summary for ${alerts.length} alerts...`);
    const summary = await aiService.summarizeAlerts(alerts);
    
    if (format === 'html') {
      const htmlReport = reportGenerator.generateHTMLReport(summary, alerts);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlReport);
    } else {
      res.json({
        success: true,
        alertCount: alerts.length,
        summary: summary,
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /alerts/stats - Get alert statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let alerts;
    let dateRange;
    
    switch (period) {
      case 'today':
        alerts = await mailpitService.getTodayAlerts();
        dateRange = new Date().toISOString().split('T')[0];
        break;
      case 'yesterday':
        alerts = await mailpitService.getYesterdayAlerts();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateRange = yesterday.toISOString().split('T')[0];
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid period. Use "today" or "yesterday"'
        });
    }

    // Calculate statistics
    const sources = {};
    const severities = {};
    const hourly = {};
    
    alerts.forEach(alert => {
      // Count by source
      sources[alert.source] = (sources[alert.source] || 0) + 1;
      
      // Count by severity
      severities[alert.severity] = (severities[alert.severity] || 0) + 1;
      
      // Count by hour
      const hour = new Date(alert.date).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });

    res.json({
      success: true,
      period,
      dateRange,
      totalAlerts: alerts.length,
      statistics: {
        bySource: sources,
        bySeverity: severities,
        byHour: hourly
      }
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /alerts/recent - Get recent alerts (last 2 hours for testing)
 */
router.get('/recent', async (req, res) => {
  try {
    console.log('Fetching recent alerts...');
    const alerts = await mailpitService.getRecentAlerts();
    
    res.json({
      success: true,
      count: alerts.length,
      timeRange: 'Last 2 hours',
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
