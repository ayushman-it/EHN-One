module.exports = {
  apps: [
    {
      name: 'ehnone-api',
      script: 'backend/server.js',
      cwd: '/var/www/ehnone/current',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4100,
        HOST: '127.0.0.1',
      },
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/ehnone/logs/error.log',
      out_file: '/var/www/ehnone/logs/out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
    },
  ],
};
