# Mailpit Alert Summarizer

AI-powered alert summarizer that ingests alerts from Mailpit, processes them using Google's Gemini API, and sends daily summary reports via email.

## 🚀 Features

- **Mailpit Integration**: Automatically fetches alerts from Mailpit REST API
- **AI Summarization**: Uses Google Gemini to intelligently summarize alerts
- **Automated Reports**: Daily scheduled reports with beautiful HTML formatting
- **RESTful API**: Complete API for managing alerts and reports
- **SMTP Support**: Configurable email delivery with attachment support
- **Error Handling**: Robust error handling with fallback reports
- **Health Monitoring**: Built-in health checks and status monitoring

## 📋 Prerequisites

- Node.js 16+ (LTS recommended)
- Mailpit instance (local or remote)
- Google Gemini API key
- SMTP server access

## 🛠️ Installation

1. **Clone and setup**:
```bash
cd /home/devops/Desktop/mailpitAI
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the application**:
```bash
npm start
```




## ⚙️ Configuration

Create a `.env` file with the following variables:

### Required Variables
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
MODEL=gemini-2.0-flash

# Email Configuration
TO_EMAIL=your-email@example.com
SMTP_HOST=your-smtp-host.com

# Mailpit
MAILPIT_BASE_URL=http://localhost:8025
```

### Optional Variables
```env
# Server
PORT=3000

# SMTP Details
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_EMAIL=alerts@yourdomain.com

# Scheduling
DAILY_REPORT_CRON=59 23 * * *  # 23:59 daily
```

## 🔗 API Endpoints

### Health & Status
- `GET /health` - Application health check
- `GET /` - API documentation

### Alerts Management
- `GET /alerts/today` - Get today's alerts
- `GET /alerts/yesterday` - Get yesterday's alerts  
- `GET /alerts/range?start=2024-01-01&end=2024-01-02` - Get alerts for date range
- `POST /alerts/summarize` - Generate AI summary for provided alerts
- `GET /alerts/stats?period=today|yesterday` - Get alert statistics

### Reports Management
- `GET /reports/generate/2024-01-01?format=html|json` - Generate report for specific date
- `POST /reports/send/2024-01-01` - Generate and email report for specific date
- `POST /reports/run-daily` - Manually trigger daily summary job
- `GET /reports/job-status` - Get daily job status
- `POST /reports/test-email` - Send test email

## 📊 Usage Examples

### Get Today's Alerts
```bash
curl http://localhost:3000/alerts/today
```

### Generate HTML Report
```bash
curl "http://localhost:3000/reports/generate/2024-01-15?format=html"
```

### Manually Trigger Daily Summary
```bash
curl -X POST http://localhost:3000/reports/run-daily
```

### Send Test Email
```bash
curl -X POST http://localhost:3000/reports/test-email
```

## 📁 Project Structure

```
src/
├── config/           # Configuration management
├── services/         # External service integrations
│   ├── mailpitService.js    # Mailpit API integration
│   └── aiService.js         # Gemini AI integration
├── report/           # Report generation
│   └── reportGenerator.js   # HTML report creator
├── email/            # Email functionality
│   └── mailer.js            # SMTP email sender
├── jobs/             # Scheduled tasks
│   └── dailySummary.js      # Daily summary job
├── routes/           # API routes
│   ├── alerts.js            # Alert endpoints
│   └── reports.js           # Report endpoints
└── index.js          # Application entry point
```

## 🤖 AI Integration

The application uses Google's Gemini API to:
- Analyze alert patterns and frequency
- Group alerts by source (Grafana, Kibana, Jenkins, etc.)
- Categorize by severity (P1, P2, P3, Info)
- Identify recurring issues
- Generate actionable recommendations

### Sample AI Prompt
```
Summarize the following DevOps alert emails into a daily report:
- Group alerts by source (Grafana, Kibana, Jenkins, etc.)
- Provide counts by severity (P1, P2, Info)
- Highlight top recurring issues
- Suggest 1-2 recommended actions
Format output as Markdown with tables and bullet points.
```

## 📧 Email Reports

Daily reports include:
- **Executive Summary**: Total alerts, sources, critical count
- **Source Breakdown**: Alerts grouped by monitoring system
- **Severity Analysis**: P1/P2/P3/Info categorization
- **Trending Issues**: Most frequent alert patterns
- **Recommendations**: AI-generated action items
- **Raw Data**: JSON attachment with full alert details

## ⏰ Scheduling

The application runs a daily summary job at 23:59 by default. This:
1. Fetches previous day's alerts from Mailpit
2. Sends alerts to Gemini for AI analysis
3. Generates formatted HTML report
4. Emails report to configured recipients
5. Logs completion status

## 🔧 Troubleshooting

### Common Issues

**SMTP Connection Failed**
```bash
# Test SMTP settings
curl -X POST http://localhost:3000/reports/test-email
```

**Mailpit Connection Issues**
```bash
# Check Mailpit health
curl http://localhost:8025/api/v1/info
```

**Gemini API Errors**
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota and billing status
- Review request size (large alert bodies may hit limits)

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm start
```

## 🔐 Security Notes

- Store sensitive credentials in `.env` file (never commit)
- The application filters sensitive data before sending to AI
- SMTP passwords are handled securely by nodemailer
- Consider using app passwords for Gmail SMTP

## 🚀 Production Deployment

### Docker Support (Coming Soon)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Considerations
- Set `NODE_ENV=production`
- Use proper logging levels
- Configure health check monitoring
- Set up proper SMTP relay
- Consider rate limiting for API endpoints

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# Test email functionality  
curl -X POST http://localhost:3000/reports/test-email

# Generate sample report
curl -X POST http://localhost:3000/reports/run-daily
```

## 📝 Logs

Application logs include:
- Alert fetching operations
- AI API requests/responses  
- Email sending status
- Job execution results
- Error details with stack traces

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Test individual components using API endpoints
4. Create an issue with detailed error information

---

**Happy Alert Monitoring! 🎉**
