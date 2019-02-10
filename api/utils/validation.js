const { validationResult } = require('express-validator/check');

exports.handleValidationErrors = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      type: 'Error',
      error: (errors.array())[0].msg,
    });
    return true;
  }
  return false;
};
