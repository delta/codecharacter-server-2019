const express = require('express');
const User = require('../models').user;

const router = express.Router();

router.get('/', (req, res) => {
  const { username, fullName, country } = req.user;
  res.send({ username, fullName, country });
});

router.get('/view/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({
      where: { username },
      attributes: ['username', 'fullName', 'country'],
    });
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/update', async (req, res) => {
  try {
    await User.update(req.body, { where: { id: req.user.id } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
