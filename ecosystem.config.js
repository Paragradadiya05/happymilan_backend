module.exports = {
  apps: [
    {
      name: 'hm-be-staging',
      script: './build/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
