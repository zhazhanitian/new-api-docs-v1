module.exports = {
  apps: [
    {
      name: 'new-api-docs',
      script: 'bun',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 9010,
      },
    },
  ],
};
