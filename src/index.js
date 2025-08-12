const express = require('express');
const config = require('./config');
const alertsRouter = require('./routes/alerts');
const reportsRouter = require('./routes/reports');
const dailySummaryJob = require('./jobs/dailySummary');
const mailer = require('./email/mailer');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/alerts', alertsRouter);
app.use('/reports', reportsRouter);

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    // Check SMTP connection
    const smtpHealthy = await mailer.testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        smtp: smtpHealthy ? 'healthy' : 'unhealthy',
        scheduler: dailySummaryJob.getStatus().isRunning ? 'running' : 'idle'
      },
      config: {
        mailpitUrl: config.MAILPIT_BASE_URL,
        smtpHost: config.SMTP.HOST,
        aiModel: config.MODEL,
        cronSchedule: config.DAILY_REPORT_CRON
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Root endpoint with API documentation
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Mailpit Alert Summarizer',
    version: '1.0.0',
    description: 'AI-powered alert summarizer that ingests from Mailpit and sends daily reports',
    endpoints: {
      health: 'GET /health - Health check',
      alerts: {
        today: 'GET /alerts/today - Get today\'s alerts',
        yesterday: 'GET /alerts/yesterday - Get yesterday\'s alerts',
        range: 'GET /alerts/range?start=YYYY-MM-DD&end=YYYY-MM-DD - Get alerts in date range',
        summarize: 'POST /alerts/summarize - Generate summary for provided alerts',
        stats: 'GET /alerts/stats?period=today|yesterday - Get alert statistics'
      },
      reports: {
        generate: 'GET /reports/generate/:date?format=html|json - Generate report for date',
        send: 'POST /reports/send/:date - Generate and send report for date',
        runDaily: 'POST /reports/run-daily - Manually trigger daily summary',
        jobStatus: 'GET /reports/job-status - Get job status',
        testEmail: 'POST /reports/test-email - Send test email'
      }
    },
    config: {
      mailpitUrl: config.MAILPIT_BASE_URL,
      smtpHost: config.SMTP.HOST,
      cronSchedule: config.DAILY_REPORT_CRON
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
async function startServer() {
  try {
    // Test SMTP connection on startup
    console.log('Testing SMTP connection...');
    const smtpWorking = await mailer.testConnection();
    if (!smtpWorking) {
      console.warn('⚠️  SMTP connection failed - emails may not work properly');
    }

    // Start the daily summary job scheduler
    console.log('Starting daily summary scheduler...');
    dailySummaryJob.start();

    // Start Express server
    const server = app.listen(config.PORT, () => {
      console.log(`
🚀 Mailpit Alert Summarizer is running!

📊 Server: http://localhost:${config.PORT}
📧 Mailpit: ${config.MAILPIT_BASE_URL}
🤖 AI Model: ${config.MODEL}
📅 Daily Report: ${config.DAILY_REPORT_CRON}
📮 Email: ${config.FROM_EMAIL} → ${config.TO_EMAIL}

Available endpoints:
- GET  /health - Health check
- GET  /alerts/today - Today's alerts
- POST /reports/run-daily - Manual daily summary
- POST /reports/test-email - Send test email

Ready to process alerts! 🎉
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startServer();
