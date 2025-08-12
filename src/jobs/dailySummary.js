const cron = require('node-cron');
const config = require('../config');
const mailpitService = require('../services/mailpitService');
const aiService = require('../services/aiService');
const reportGenerator = require('../report/reportGenerator');
const mailer = require('../email/mailer');

class DailySummaryJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the daily summary job
   */
  start() {
    console.log(`Starting daily summary job with cron: ${config.DAILY_REPORT_CRON}`);
    
    cron.schedule(config.DAILY_REPORT_CRON, async () => {
      if (this.isRunning) {
        console.log('Daily summary job already running, skipping...');
        return;
      }

      console.log('Starting daily summary job...');
      await this.runDailySummary();
    });

    console.log('Daily summary job scheduled successfully');
  }

  /**
   * Run the daily summary process
   */
  async runDailySummary(targetDate = null) {
    if (this.isRunning) {
      throw new Error('Daily summary job is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting daily alert summary process...');

      // Step 1: Fetch alerts from Mailpit
      console.log('📧 Fetching alerts from Mailpit...');
      let alerts;
      
      if (targetDate) {
        alerts = await this.getAlertsForDate(targetDate);
      } else {
        // For testing: get today's alerts instead of yesterday's
        // In production, change this back to getYesterdayAlerts()
        alerts = await mailpitService.getTodayAlerts();
        console.log('🧪 Using today\'s alerts for testing');
      }
      
      console.log(`✅ Retrieved ${alerts.length} alerts`);

      // Debug: log alert details
      alerts.forEach(alert => {
        console.log(`- ${alert.subject} | ${alert.source} | ${alert.severity} | ${alert.date.toISOString()}`);
      });

      // Step 2: Send to AI for summarization
      console.log('🤖 Generating AI summary...');
      const aiSummary = await aiService.summarizeAlerts(alerts);
      console.log('✅ AI summary generated');

      // Step 3: Generate HTML report
      console.log('📄 Generating HTML report...');
      const reportDate = targetDate || new Date(); // Use today's date for testing
      const htmlReport = reportGenerator.generateHTMLReport(aiSummary, alerts, reportDate);
      console.log('✅ HTML report generated');

      // Step 4: Send report via email
      console.log('📨 Sending report via email...');
      await mailer.sendDailyReport(htmlReport, reportDate, alerts);
      console.log('✅ Report sent successfully');

      // Step 5: Log completion
      const duration = (Date.now() - startTime) / 1000;
      console.log(`🎉 Daily summary completed in ${duration}s`);

      return {
        success: true,
        alertsProcessed: alerts.length,
        duration,
        reportDate
      };

    } catch (error) {
      console.error('❌ Daily summary failed:', error);
      
      // Send error notification
      try {
        await this.sendErrorNotification(error);
      } catch (notificationError) {
        console.error('Failed to send error notification:', notificationError);
      }

      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get alerts for a specific date
   */
  async getAlertsForDate(date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    return await mailpitService.fetchMessages(startDate, endDate);
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(error) {
    try {
      const errorReport = `
        <h2>🚨 Daily Alert Summary - Error Report</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto;">${error.stack}</pre>
        <p>The daily alert summary job has failed. Please check the application logs and configuration.</p>
      `;

      await mailer.transporter.sendMail({
        from: config.FROM_EMAIL,
        to: config.TO_EMAIL,
        subject: '🚨 Daily Alert Summary - Job Failed',
        html: errorReport
      });
    } catch (emailError) {
      console.error('Failed to send error notification email:', emailError);
    }
  }

  /**
   * Run summary manually (for testing)
   */
  async runManual(date = null) {
    return await this.runDailySummary(date);
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cronSchedule: config.DAILY_REPORT_CRON,
      nextRun: cron.schedule(config.DAILY_REPORT_CRON, () => {}).getStatus()
    };
  }
}

module.exports = new DailySummaryJob();
