// Load environment variables first
import { config } from 'dotenv';
config();

// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';

console.log('🔧 Sentry DSN loaded:', process.env.SENTRY_DSN ? 'YES' : 'NO');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  // Only debug in development
  debug: process.env.NODE_ENV === 'development',
  
  // Adjust sample rate for production (1.0 = 100%, 0.1 = 10%)
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
