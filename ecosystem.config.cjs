/**
 * PM2 ecosystem — Next.js production server (`next start`)
 *
 * Prasyarat: `npm run build` sebelum start production.
 *
 * Contoh:
 *   npm run build && npm run pm2:start
 *   npm run pm2:logs
 *   npm run pm2:reload
 *
 * Port & env: salin dari `.env` / shell (NEXTAUTH_URL, DATABASE_URL, dll).
 * PORT default 3000; override: `PORT=8080 npm run pm2:start`
 */
const path = require("path");

const appDir = __dirname;
const name = "any-documentation";
const nextBin = path.join(appDir, "node_modules", "next", "dist", "bin", "next");

module.exports = {
  apps: [
    {
      name,
      cwd: appDir,
      script: nextBin,
      args: "start",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 15,
      min_uptime: "10s",
      max_memory_restart: "1G",
      listen_timeout: 15_000,
      kill_timeout: 10_000,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
      },
      error_file: path.join(appDir, "logs", "pm2-error.log"),
      out_file: path.join(appDir, "logs", "pm2-out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
