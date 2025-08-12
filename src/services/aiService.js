const axios = require('axios');
const config = require('../config');

class AIService {
  constructor() {
    this.apiKey = config.GEMINI_API_KEY;
    this.model = config.MODEL;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Summarize alerts using Gemini API
   * @param {Array} alerts - Array of alert objects
   * @returns {String} Markdown summary
   */
  async summarizeAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
      return this.generateEmptyReport();
    }

    try {
      const prompt = this.buildPrompt(alerts);
      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('AI summarization failed:', error.message);
      return this.generateFallbackReport(alerts);
    }
  }

  /**
   * Build prompt for Gemini API
   */
  buildPrompt(alerts) {
    const alertsData = alerts.map(alert => ({
      subject: alert.subject,
      source: alert.source,
      severity: alert.severity,
      date: alert.date.toISOString(),
      // Truncate body to avoid token limits
      body: alert.body.substring(0, 500)
    }));

    return `
Analyze the following DevOps alert emails and create a comprehensive daily report with criticality assessment:

ALERTS DATA:
${JSON.stringify(alertsData, null, 2)}

Please provide a detailed analysis with:

1. **Executive Summary**
   - Total alerts count and time range
   - Overall system health status
   - Immediate action items

2. **Critical Issues Analysis** (P1/CRITICAL)
   - List all critical alerts
   - Assess business impact (High/Medium/Low)
   - Urgency rating (Immediate/Within 1 hour/Within 4 hours)
   - Required actions and escalation needs

3. **High Priority Issues** (P2/ALERT/HIGH)
   - Group by system/service affected
   - Potential for escalation to critical
   - Recommended response timeline

4. **Monitoring & Trends**
   - Alert frequency patterns
   - Recurring issues that need attention
   - Systems showing degradation trends

5. **Source Analysis**
   - Breakdown by monitoring system (Grafana, Kibana, Jenkins, etc.)
   - Which systems are generating most alerts
   - Coverage gaps or blind spots

6. **Actionable Recommendations**
   - Immediate actions required (next 1 hour)
   - Short-term actions (next 4 hours)
   - Long-term improvements (next week)
   - Alert optimization suggestions

7. **Risk Assessment**
   - Current system stability score (1-10)
   - Areas of highest risk
   - Potential cascade failure points

Format as clean Markdown with:
- Clear severity-based sections
- Tables for statistics and metrics
- Bullet points for actions
- Emoji indicators for urgency levels
- Professional tone suitable for management review

Focus on:
- Business impact assessment
- Clear priorities and timelines
- Specific actionable items
- Resource allocation needs

Important: Classify criticality based on business impact, not just technical severity. Consider customer impact, revenue risk, and service availability.
`;
  }

  /**
   * Call Gemini API
   */
  async callGeminiAPI(prompt) {
    const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data.candidates && response.data.candidates[0]) {
      return response.data.candidates[0].content.parts[0].text;
    }

    throw new Error('No response from Gemini API');
  }

  /**
   * Generate fallback report when AI fails
   */
  generateFallbackReport(alerts) {
    const sources = {};
    const severities = {};
    const subjects = {};

    alerts.forEach(alert => {
      sources[alert.source] = (sources[alert.source] || 0) + 1;
      severities[alert.severity] = (severities[alert.severity] || 0) + 1;
      subjects[alert.subject] = (subjects[alert.subject] || 0) + 1;
    });

    const topSubjects = Object.entries(subjects)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return `
# Daily Alert Summary (Fallback Report)

⚠️ *AI summarization temporarily unavailable - showing basic statistics*

## Overview
- **Total Alerts:** ${alerts.length}
- **Unique Sources:** ${Object.keys(sources).length}
- **Date Range:** ${alerts.length > 0 ? new Date(Math.min(...alerts.map(a => a.date))).toDateString() : 'N/A'}

## Alerts by Source
${Object.entries(sources).map(([source, count]) => `- **${source}:** ${count}`).join('\n')}

## Alerts by Severity
${Object.entries(severities).map(([severity, count]) => `- **${severity}:** ${count}`).join('\n')}

## Top Alert Subjects
${topSubjects.map(([subject, count]) => `- ${subject} (${count}x)`).join('\n')}

## Recommendations
- Review high-frequency alerts for potential automation opportunities
- Check if critical alerts require immediate attention
- Consider alert fatigue reduction strategies
`;
  }

  /**
   * Generate report when no alerts found
   */
  generateEmptyReport() {
    return `
# Daily Alert Summary

## Overview
- **Total Alerts:** 0
- **Status:** ✅ No alerts received in the last 24 hours

## Summary
No monitoring alerts were received during the reporting period. This could indicate:
- System stability
- Potential monitoring system issues
- Alert routing problems

## Recommendations
- Verify monitoring systems are operational
- Check alert routing configuration
- Review alert thresholds if silence seems unusual
`;
  }
}

module.exports = new AIService();
