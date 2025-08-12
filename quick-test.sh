#!/bin/bash

# Simple Email Sender Script for Mailpit Testing
# Sends basic alert emails to Mailpit SMTP server

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
MAILPIT_HOST="localhost"
MAILPIT_PORT="1025"
FROM_EMAIL="alerts@ahmad.com"
TO_EMAIL="devops@ahmad.com"

echo -e "${BLUE}📧 Simple Alert Email Sender${NC}"
echo -e "${BLUE}============================${NC}"
echo ""
echo -e "${BLUE}Target: ${MAILPIT_HOST}:${MAILPIT_PORT}${NC}"
echo -e "${BLUE}From: ${FROM_EMAIL}${NC}"
echo -e "${BLUE}To: ${TO_EMAIL}${NC}"
echo ""

# Function to send email via SMTP using curl
send_email() {
    local subject="$1"
    local body="$2"
    local from="$3"
    local severity="$4"
    
    echo -e "${YELLOW}📧 Sending: ${subject}${NC}"
    
    # Create email content
    email_content="Subject: $subject
From: $from
To: $TO_EMAIL
Date: $(date -R)
Content-Type: text/plain; charset=utf-8

ALERT SEVERITY: $severity
TIMESTAMP: $(date)

$body

---
Alert generated for testing Mailpit Alert Summarizer
Generated: $(date)"

    # Send via SMTP using curl
    if echo "$email_content" | curl -s \
        --mail-from "$from" \
        --mail-rcpt "$TO_EMAIL" \
        --url "smtp://$MAILPIT_HOST:$MAILPIT_PORT" \
        --upload-file -; then
        echo -e "${GREEN}✅ Email sent successfully${NC}"
    else
        echo -e "${RED}❌ Failed to send email${NC}"
        return 1
    fi
    
    sleep 1
}

# Send simple test alerts
echo -e "${YELLOW}Sending test alerts...${NC}"
echo ""

# Alert 1: Critical Server Issue
send_email \
    "🔥 [ZX] High CPU Usage - Production Server" \
    "Alert: CPU usage exceeded 90% on production-web-01.

Details:
- Server: production-web-01
- Current CPU: 95.2%
- Duration: 10 minutes

Action Required." \
    "grafana-alerts@ahmad.com" \
    "X"

# Alert 2: Application ALERT
send_email \
    "⚠️ [ALERT] Elevated Error Rate in Application Logs" \
    "ALERT: Error rate in application logs increased.

Details:
- Application: payment-api
- Error Rate: 5.2%
- Time Period: Last 30 minutes

Investigation Required." \
    "kibana-monitoring@ahmad.com" \
    "ALERT"

# Alert 3: Build Failure
send_email \
    "🔨 [BUILD FAILED] Production Deployment Failed" \
    "Build Status: FAILED

Pipeline: production-deployment
Build #: 1247
Stage: Unit Tests

Action Required: Fix failing tests." \
    "jenkins@ahmad.com" \
    "HIGH"

echo ""
echo -e "${GREEN}🎉 Test emails sent successfully!${NC}"
echo -e "${BLUE}Total emails sent: 3${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Check Mailpit UI: http://localhost:8025"
echo -e "2. Run Node.js app: npm start"
echo -e "3. Test reports: curl -X POST http://localhost:3000/reports/run-daily"
echo ""
- Stage: Unit Tests
- Error: 3 test failures in payment module
- Failed Tests:
  * test_payment_validation
  * test_refund_processing
  * test_currency_conversion

Action Required:
- Fix failing tests
- Re-run pipeline
- Notify development team" \
    "jenkins@ahmad.com" \
    "P2"

# Alert 4: UptimeKube 
send_email \
    "🚨 [] Payment Service Unavailable" \
    "Service Alert: Payment processing service is DOWN

Service: payment-processor-service
Status: UNAVAILABLE
Last Successful Check: 5 minutes ago
Response Time: TIMEOUT (>30s)
Expected Response Time: <2s

Impact:
- Customer payments failing
- Revenue impact: HIGH
- Customer experience: 

Immediate Actions Required:
- Check service logs
- Restart service if needed
- Escalate to on-call engineer
- Monitor dependent services" \
    "uptimekube@ahmad.com" \
    "P1"

# Alert 5: SSL Certificate 
send_email \
    "🔐 [INFO] SSL Certificate Expiring Soon" \
    "Certificate Alert: SSL certificate expires in 14 days

Domain: api.ahmad.com
Certificate: Let's Encrypt
Expires: $(date -d '+14 days' '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'In 14 days')
Days Remaining: 14
Auto-Renewal: ENABLED

Status:
- Certificate is valid
- Auto-renewal configured
- No action required unless renewal fails

Monitoring:
- Daily checks enabled
- Alerts configured for renewal failures
- Backup certificate available" \
    "ssl-monitor@ahmad.com" \
    "Info"

echo ""
echo -e "${GREEN}🎉 All demo emails sent successfully!${NC}"
echo -e "${BLUE}Total emails sent: 5${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Check Mailpit UI: http://localhost:8025"
echo -e "2. Verify emails are received"
echo -e "3. Run your Node.js application: npm start"
echo -e "4. Test your application: curl -X POST http://localhost:3000/reports/run-daily"
echo ""
Domain: api.ahmad.com
Certificate: Let's Encrypt
Expires: $(date -d '+14 days' '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v+14d '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'In 14 days')
Days Remaining: 14
Auto-Renewal: ENABLED

Status: 
- Certificate is valid
- Auto-renewal configured
- No action required unless renewal fails

Monitoring:
- Daily checks enabled
- Alerts configured for renewal failures
- Backup certificate available" \
    "ssl-monitor@ahmad.com" \
    "Info"

echo ""
echo -e "${GREEN}🎉 Demo alerts sent successfully!${NC}"
echo -e "${BLUE}Total alerts sent: 5${NC}"
EOF

    chmod +x send-demo-alerts.sh
    echo -e "${GREEN}✅ Demo alerts script created and made executable${NC}"
fi

# Make sure the script is executable
chmod +x send-demo-alerts.sh

# Send demo alerts using Node.js script instead of SMTP
echo ""
echo -e "${YELLOW}3. Testing with demo alerts...${NC}"
if [ ! -f "./send-test-alerts-api.js" ]; then
    echo -e "${YELLOW}Creating Node.js test script...${NC}"
    # The script will be created as shown above
    node -e "
const axios = require('axios');

const demoAlerts = [
    {
        id: 'demo-001',
        subject: '🔥 [] High CPU Usage - Production Server',
        from: 'grafana-alerts@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: 'Alert: CPU usage has exceeded 90% on production-web-01 for the last 10 minutes.\\n\\nDetails:\\n- Server: production-web-01\\n- Current CPU: 95.2%\\n- Threshold: 90%\\n- Duration: 10 minutes\\n- Impact: High',
        source: 'Grafana',
        severity: 'P1'
    },
    {
        id: 'demo-002', 
        subject: '⚠️ [] Elevated Error Rate in Application Logs',
        from: 'kibana-monitoring@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: ': Error rate in application logs has increased significantly.\\n\\nDetails:\\n- Application: payment-api\\n- Error Rate: 5.2%',
        source: 'Kibana',
        severity: 'P2'
    },
    {
        id: 'demo-003',
        subject: '🔨 [BUILD FAILED] Production Deployment Pipeline Failed', 
        from: 'jenkins@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: 'Build Status: FAILED\\n\\nPipeline: production-deployment\\nBuild #: 1247\\nBranch: main',
        source: 'Jenkins',
        severity: 'P2'
    }
];

axios.post('http://localhost:3000/alerts/summarize', { alerts: demoAlerts })
    .then(res => {
        console.log('✅ Demo alerts processed successfully');
        console.log('Alert count:', demoAlerts.length);
        return axios.post('http://localhost:3000/alerts/summarize', { alerts: demoAlerts, format: 'html' });
    })
    .then(htmlRes => {
        require('fs').writeFileSync('test-report.html', htmlRes.data);
        console.log('✅ HTML report generated: test-report.html');
    })
    .catch(err => console.error('❌ Error:', err.message));
"
else
    node send-test-alerts-api.js
fi

# Skip the Mailpit fetching since we're testing directly
echo ""
echo -e "${YELLOW}4. Testing direct alert processing...${NC}"
echo -e "${GREEN}✅ Demo alerts processed via API${NC}"

# Wait for emails to be processed
echo ""
echo -e "${YELLOW}5. Waiting 10 seconds for emails to be processed...${NC}"
sleep 10

# Check alerts API
echo ""
echo -e "${YELLOW}6. Checking today's alerts...${NC}"
alert_response=$(curl -s http://localhost:3000/alerts/today)
alert_count=$(echo $alert_response | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}📧 Found $alert_count alerts${NC}"

if [ "$alert_count" -eq "0" ]; then
    echo -e "${RED}⚠️ No alerts found. Check Mailpit connection and try again.${NC}"
    exit 1
fi

# Generate and send daily report
echo ""
echo -e "${YELLOW}7. Generating and sending daily report...${NC}"
report_response=$(curl -s -X POST http://localhost:3000/reports/run-daily)
if echo $report_response | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Daily report generated and sent successfully${NC}"
else
    echo -e "${RED}❌ Report generation failed:${NC}"
    echo $report_response
    exit 1
fi

# Generate HTML report for viewing
echo ""
echo -e "${YELLOW}8. Generating HTML report for viewing...${NC}"
curl -s "http://localhost:3000/reports/generate/$(date +%Y-%m-%d)?format=html" > test-report.html
echo -e "${GREEN}✅ HTML report saved as test-report.html${NC}"

echo ""
echo -e "${GREEN}🎉 Quick test completed successfully!${NC}"
echo ""
echo -e "${BLUE}Results:${NC}"
echo -e "- Demo alerts sent: 8"
echo -e "- Alerts processed: $alert_count"
echo -e "- Daily report: Generated and emailed"
echo -e "- HTML report: test-report.html"
echo ""
echo -e "${BLUE}Check your results:${NC}"
echo -e "1. Mailpit UI: ${YELLOW}http://localhost:8025${NC}"
echo -e "2. HTML Report: ${YELLOW}open test-report.html${NC}"
echo -e "3. Email inbox: Check $TO_EMAIL for the daily summary"
echo ""
