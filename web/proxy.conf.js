module.exports = [
  {
    context: ['/api'],
    target: process.env.API_URL || 'http://localhost:3000',
    secure: false,
  },
  {
    context: ['/storage'],
    target: process.env.STORAGE_URL || 'http://localhost:9000',
    secure: false,
    pathRewrite: { '^/storage': '/trailshot' },
  },
];
