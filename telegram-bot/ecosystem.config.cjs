// PM2 process config — `pm2 start ecosystem.config.cjs`
module.exports = {
  apps: [
    {
      name: "vertlix-bot",
      script: "dist/index.js",
      instances: 1,           // Telegram long-polling: keep a single instance
      exec_mode: "fork",
      max_memory_restart: "300M",
      env: { NODE_ENV: "production" },
      // Load real values from the server environment / .env, not from here.
    },
  ],
};
