module.exports = {
  apps: [
    {
      name: "proace-predictions",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      max_memory_restart: "200M",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      combine_logs: true,
      error_file: "logs/error.log",
      out_file: "logs/output.log",
      exp_backoff_restart_delay: 100
    }
  ]
};
