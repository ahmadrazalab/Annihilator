const axios = require('axios');

// Demo alerts data
const demoAlerts = [
    {
        id: 'demo-001',
        subject: '🔥 [x] High CPU Usage - Production Server',
        from: 'grafana-alerts@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: `Alert: CPU usage has exceeded 90% on production-web-01 for the last 10 minutes.

Details:
- Server: production-web-01
- Current CPU: 95.2%
- Threshold: 90%
- Duration: 10 minutes
- Impact: High

Recommended Actions:
- Check running processes
- Scale horizontally if needed
- Investigate potential memory leaks`,
        source: 'Grafana',
        severity: 'P1'
    },
    {
        id: 'demo-002',
        subject: '⚠️ [ALERT] Elevated Error Rate in Application Logs',
        from: 'kibana-monitoring@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: `ALERT: Error rate in application logs has increased significantly.

Details:
- Application: payment-api
- Error Rate: 5.2% (normal: <1%)
- Time Period: Last 30 minutes
- Error Types: Database connection timeouts, validation errors

Investigation Required:
- Check database connectivity
- Review recent deployments
- Monitor for further escalation`,
        source: 'Kibana',
        severity: 'P2'
    },
    {
        id: 'demo-003',
        subject: '🔨 [BUILD FAILED] Production Deployment Pipeline Failed',
        from: 'jenkins@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: `Build Status: FAILED

Pipeline: production-deployment
Build #: 1247
Branch: main
Commit: abc123def456
Duration: 15m 32s

Failure Details:
- Stage: Unit Tests
- Error: 3 test failures in payment module
- Failed Tests: 
  * test_payment_validation
  * test_refund_processing  
  * test_currency_conversion

Action Required:
- Fix failing tests
- Re-run pipeline
- Notify development team`,
        source: 'Jenkins',
        severity: 'P2'
    },
    {
        id: 'demo-004',
        subject: '🚨 [x] Payment Service Unavailable',
        from: 'uptimekube@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: `Service Alert: Payment processing service is DOWN

Service: payment-processor-service
Status: UNAVAILABLE
Last Successful Check: 5 minutes ago
Response Time: TIMEOUT (>30s)
Expected Response Time: <2s

Impact:
- Customer payments failing
- Revenue impact: HIGH
- Customer experience: x

Immediate Actions Required:
- Check service logs
- Restart service if needed
- Escalate to on-call engineer
- Monitor dependent services`,
        source: 'UptimeKube',
        severity: 'P1'
    },
    {
        id: 'demo-005',
        subject: '🔐 [INFO] SSL Certificate Expiring Soon',
        from: 'ssl-monitor@ahmad.com',
        to: ['devops@ahmad.com'],
        date: new Date(),
        body: `Certificate Alert: SSL certificate expires in 14 days

Domain: api.ahmad.com
Certificate: Let's Encrypt
Expires: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()}
Days Remaining: 14
Auto-Renewal: ENABLED

Status: 
- Certificate is valid
- Auto-renewal configured
- No action required unless renewal fails

Monitoring:
- Daily checks enabled
- Alerts configured for renewal failures
- Backup certificate available`,
        source: 'SSL Monitor',
        severity: 'Info'
    }
];

async function testAlertSummarization() {
    try {
        console.log('🧪 Testing Alert Summarization with Demo Data');
        console.log('===========================================\n');

        console.log(`📧 Testing with ${demoAlerts.length} demo alerts...`);
        
        // Test the summarization endpoint
        const response = await axios.post('http://localhost:3000/alerts/summarize', {
            alerts: demoAlerts,
            format: 'json'
        });

        if (response.data.success) {
            console.log('✅ Summarization successful!');
            console.log('\n📄 AI Summary:');
            console.log('===============');
            console.log(response.data.summary);
            
            // Also generate HTML report
            console.log('\n🌐 Generating HTML report...');
            const htmlResponse = await axios.post('http://localhost:3000/alerts/summarize', {
                alerts: demoAlerts,
                format: 'html'
            });
            
            // Save HTML report
            const fs = require('fs');
            fs.writeFileSync('demo-report.html', htmlResponse.data);
            console.log('✅ HTML report saved as demo-report.html');
            
        } else {
            console.error('❌ Summarization failed:', response.data.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testAlertSummarization();
