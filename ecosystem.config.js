module.exports = {
  apps: [{
    name: 'mpscan',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/mpscan/MP-scan',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'mysql://mpscan_user:Cards@3443@127.0.0.1:3306/mpscan',
      NEXTAUTH_URL: 'http://13.202.190.89',
      NEXTAUTH_SECRET: 'fP93AEZXGeCYnawPTjpp1I51X6lYnbrSW4HexBKsb4w='
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}