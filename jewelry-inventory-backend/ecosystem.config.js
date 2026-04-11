'use strict';

/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 *   Development:  pm2 start ecosystem.config.js
 *   Production:   pm2 start ecosystem.config.js --env production
 *   Reload:       pm2 reload jewelry-api
 *   Logs:         pm2 logs jewelry-api
 *   Monitor:      pm2 monit
 */
module.exports = {
  apps: [
    {
      name: 'jewelry-api',
      script: 'src/server.js',

      // Cluster mode — one worker per CPU core
      instances: 'max',
      exec_mode: 'cluster',

      // Auto-restart on memory threshold
      max_memory_restart: '512M',

      // Restart delay to avoid rapid flapping
      restart_delay: 3000,
      max_restarts: 10,

      // Watch (disabled in production — use CI/CD instead)
      watch: false,

      // Graceful shutdown — wait for in-flight requests
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000,

      // Log files (in addition to Winston file transport)
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Environment — development
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // Environment — production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
