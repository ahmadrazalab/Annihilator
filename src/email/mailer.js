const nodemailer = require('nodemailer');
const config = require('../config');

class Mailer {
  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create SMTP transporter
   */
  createTransporter() {
    return nodemailer.createTransport({
      host: config.SMTP.HOST,
      port: config.SMTP.PORT,
      secure: config.SMTP.SECURE,
      auth: config.SMTP.USER && config.SMTP.PASS ? {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS
      } : undefined,
      // Handle self-signed certificates if needed
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Send daily report email
   * @param {String} htmlReport - HTML report content
   * @param {Date} reportDate - Report date
   * @param {Array} alerts - Raw alerts for attachment
   */
  async sendDailyReport(htmlReport, reportDate = new Date(), alerts = []) {
    try {
      const subject = `Daily Alert Summary - ${this.formatDate(reportDate)}`;
      
      const mailOptions = {
        from: config.FROM_EMAIL,
        to: config.TO_EMAIL,
        subject: subject,
        html: htmlReport,
        text: this.htmlToText(htmlReport),
        // Optional: Attach raw data as JSON
        attachments: alerts.length > 0 ? [{
          filename: `alerts-${this.formatDateFile(reportDate)}.json`,
          content: JSON.stringify(alerts, null, 2),
          contentType: 'application/json'
        }] : []
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Daily report sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send daily report:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error.message);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail() {
    try {
      const mailOptions = {
        from: config.FROM_EMAIL,
        to: config.TO_EMAIL,
        subject: 'Mailpit Alert Summarizer - Test Email',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from your Mailpit Alert Summarizer application.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
          <p>Configuration is working correctly! ✅</p>
        `,
        text: 'Test email from Mailpit Alert Summarizer. Configuration is working correctly!'
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Test email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Test email failed:', error);
      throw error;
    }
  }

  /**
   * Convert HTML to plain text (basic)
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format date for filename
   */
  formatDateFile(date) {
    return date.toISOString().split('T')[0];
  }
}

module.exports = new Mailer();
