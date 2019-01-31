module.exports = (req, res, next) => {
  if (req.user) {
    return next();
  }
  return res.status(401).json({
    type: 'Error',
    error: 'Unauthorised',
  });
};
