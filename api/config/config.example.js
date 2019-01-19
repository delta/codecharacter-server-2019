const config = {
  development:
  {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
  },
  production:
  {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
  },
  test: {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
  },
};
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
