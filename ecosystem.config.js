module.exports = {
  apps: [
    {
      name: 'new-api-docs',
      script: 'bun',
      args: 'start',
      cwd: '/www/wwwroot/newapi/new-api-docs-v1-main',
      env: {
        NODE_ENV: 'production',
        PORT: 9010,
      },
    },
  ],
};
