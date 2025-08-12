const axios = require('axios');
const config = require('../config');

class MailpitService {
  constructor() {
    this.baseURL = config.MAILPIT_BASE_URL;
    this.apiURL = `${this.baseURL}/api/v1`;
    this.authConfig = this.setupAuth();
  }

  /**
   * Setup authentication configuration
   */
  setupAuth() {
    const authConfig = {};
    
    // Add basic auth if username/password provided
    if (config.MAILPIT_USERNAME && config.MAILPIT_PASSWORD) {
      authConfig.auth = {
        username: config.MAILPIT_USERNAME,
        password: config.MAILPIT_PASSWORD
      };
    }
    
    // Add headers for API access
    authConfig.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Handle HTTPS with self-signed certificates
    authConfig.httpsAgent = new (require('https').Agent)({
      rejectUnauthorized: false
    });
    
    return authConfig;
  }

  /**
   * Fetch messages from Mailpit within a date range
   * @param {Date} startDate - Start date for filtering
   * @param {Date} endDate - End date for filtering
   * @returns {Array} Array of parsed alert objects
   */
  async fetchMessages(startDate, endDate) {
    try {
      console.log(`Fetching messages from ${this.apiURL}/messages...`);
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const response = await axios.get(`${this.apiURL}/messages`, {
        ...this.authConfig,
        params: {
          limit: 1000, // Adjust as needed
        }
      });

      const messages = response.data.messages || response.data || [];
      console.log(`Retrieved ${messages.length} total messages from Mailpit`);
      
      const filteredMessages = messages.filter(msg => {
        const msgDate = new Date(msg.Created || msg.created || msg.date);
        const isInRange = msgDate >= startDate && msgDate <= endDate;
        
        // Debug logging
        console.log(`Message: ${msg.Subject || msg.subject} | Date: ${msgDate.toISOString()} | In Range: ${isInRange}`);
        
        return isInRange;
      });

      console.log(`Filtered to ${filteredMessages.length} messages in date range`);

      // Parse each message
      const alerts = [];
      for (const msg of filteredMessages) {
        try {
          const alert = await this.parseMessage(msg);
          if (alert) alerts.push(alert);
        } catch (error) {
          console.warn(`Failed to parse message ${msg.ID || msg.id}:`, error.message);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error fetching messages from Mailpit:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error(`Mailpit fetch failed: ${error.message}`);
    }
  }

  /**
   * Parse a single message into alert format
   * @param {Object} message - Raw message from Mailpit
   * @returns {Object} Parsed alert object
   */
  async parseMessage(message) {
    try {
      // Fetch full message content
      const messageId = message.ID || message.id;
      const response = await axios.get(`${this.apiURL}/message/${messageId}`, this.authConfig);
      const fullMessage = response.data;

      // Extract alert information - handle both API formats
      const alert = {
        id: messageId,
        subject: message.Subject || message.subject || 'No Subject',
        from: this.extractEmail(message.From?.Address || message.from),
        to: (message.To || message.to || []).map(t => this.extractEmail(t.Address || t)),
        date: new Date(message.Created || message.created || message.date),
        body: this.extractTextBody(fullMessage),
        source: this.identifySource(message.From?.Address || message.from, message.Subject || message.subject),
        severity: this.extractSeverity(message.Subject || message.subject, this.extractTextBody(fullMessage))
      };

      return alert;
    } catch (error) {
      console.error(`Error parsing message ${message.ID || message.id}:`, error.message);
      return null;
    }
  }

  /**
   * Extract email address from string
   */
  extractEmail(emailString) {
    if (!emailString) return '';
    const match = emailString.match(/<(.+?)>/) || emailString.match(/([^\s<>]+@[^\s<>]+)/);
    return match ? match[1] : emailString;
  }

  /**
   * Extract plain text body from message
   */
  extractTextBody(message) {
    if (message.text) return message.text;
    if (message.html) {
      // Simple HTML to text conversion
      return message.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  /**
   * Extract severity from subject and body
   */
  extractSeverity(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    
    // Critical indicators - immediate business impact
    if (text.includes('critical') || text.includes('down') || text.includes('unavailable') || 
        text.includes('outage') || text.includes('failed') || text.includes('timeout') ||
        text.includes('p1') || text.includes('urgent') || text.includes('emergency')) {
      return 'P1';
    }
    
    // High priority - significant impact, needs attention
    if (text.includes('ALERT') || text.includes('high') || text.includes('elevated') || 
        text.includes('exceeded') || text.includes('error rate') || text.includes('p2') ||
        text.includes('degraded') || text.includes('slow') || text.includes('build failed')) {
      return 'P2';
    }
    
    // Medium priority - monitoring required
    if (text.includes('medium') || text.includes('p3') || text.includes('approaching') ||
        text.includes('usage') || text.includes('capacity') || text.includes('disk space')) {
      return 'P3';
    }
    
    // Informational - awareness only
    if (text.includes('info') || text.includes('notification') || text.includes('expiring') || 
        text.includes('renewal') || text.includes('certificate') || text.includes('p4') ||
        text.includes('maintenance') || text.includes('scheduled')) {
      return 'Info';
    }
    
    return 'Unknown';
  }

  /**
   * Identify alert source from email and subject
   */
  identifySource(from, subject) {
    const email = this.extractEmail(from).toLowerCase();
    const subjectLower = subject.toLowerCase();

    if (email.includes('grafana') || subjectLower.includes('grafana')) return 'Grafana';
    if (email.includes('kibana') || subjectLower.includes('kibana')) return 'Kibana';
    if (email.includes('jenkins') || subjectLower.includes('jenkins')) return 'Jenkins';
    if (email.includes('uptimekube') || subjectLower.includes('uptimekube')) return 'UptimeKube';
    if (email.includes('prometheus') || subjectLower.includes('prometheus')) return 'Prometheus';
    if (email.includes('system') || subjectLower.includes('system')) return 'System Monitoring';
    if (email.includes('ssl') || subjectLower.includes('ssl') || subjectLower.includes('certificate')) return 'SSL Monitor';
    if (subjectLower.includes('build') || subjectLower.includes('deploy')) return 'CI/CD';
    if (subjectLower.includes('database') || subjectLower.includes('db')) return 'Database';
    if (subjectLower.includes('alert')) return 'Generic Alert';
    
    return 'Unknown';
  }

  /**
   * Get yesterday's alerts
   */
  async getYesterdayAlerts() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.fetchMessages(yesterday, today);
  }

  /**
   * Get today's alerts (for testing)
   */
  async getTodayAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Getting today\'s alerts...');
    return await this.fetchMessages(today, tomorrow);
  }

  /**
   * Get recent alerts (last 2 hours for testing)
   */
  async getRecentAlerts() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    console.log('Getting recent alerts (last 2 hours)...');
    return await this.fetchMessages(twoHoursAgo, now);
  }
}

module.exports = new MailpitService();
