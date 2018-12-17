const config = {
  development:
  {
    app: {
      port: 'Your port number',
    },
  },
  production:
  {
    app: {
      port: 'Your port number',
    },
  },
};
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
