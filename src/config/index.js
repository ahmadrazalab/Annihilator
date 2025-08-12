require('dotenv').config();

const config = {
  // Server
  PORT: process.env.PORT || 3000,
  
  // Mailpit
  MAILPIT_BASE_URL: process.env.MAILPIT_BASE_URL || 'http://localhost:8025',
  MAILPIT_USERNAME: process.env.MAILPIT_USERNAME,
  MAILPIT_PASSWORD: process.env.MAILPIT_PASSWORD,
  
  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MODEL: process.env.MODEL || 'gemini-2.0-flash',
  
  // SMTP
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: parseInt(process.env.SMTP_PORT) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS
  },
  
  // Email
  FROM_EMAIL: process.env.FROM_EMAIL || 'alerts@example.com',
  TO_EMAIL: process.env.TO_EMAIL,
  
  // Scheduling
  DAILY_REPORT_CRON: process.env.DAILY_REPORT_CRON || '59 23 * * *', // 23:59 daily
};

// Validate required environment variables
const required = ['GEMINI_API_KEY', 'TO_EMAIL', 'SMTP_HOST'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = config;
