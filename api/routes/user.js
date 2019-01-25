const express = require('express');
const User = require('../models').user;

const router = express.Router();

router.get('/', (req, res) => {
  const { username, fullName, country } = req.user;
  res.status(200).json({
    type: 'Success',
    error: '',
    userDetails: { username, fullName, country },
  });
});

router.get('/view/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const userDetails = await User.findOne({
      where: { username },
      attributes: ['username', 'fullName', 'country'],
    });
    res.status(200).json({
      type: 'Success',
      error: '',
      userDetails,
    });
  } catch (error) {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

router.post('/update', async (req, res) => {
  try {
    await User.update(req.body, { where: { id: req.user.id } });
    res.status(200).json({
      type: 'Success',
      error: '',
    });
  } catch (error) {
    res.status(500).json({
      type: 'Error',
      error: 'Internal server error',
    });
  }
});

module.exports = router;
