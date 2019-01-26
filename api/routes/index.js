const express = require('express');
const codeRoutes = require('./code');
const userAuthRoutes = require('./userAuth');
const userRoutes = require('./user');
const leaderboardRoutes = require('./leaderboard');
const simulationRoutes = require('./simulation');
const isLoggedIn = require('../middlewares/isLoggedIn');

const router = express.Router();

router.use('/code', isLoggedIn, codeRoutes);
router.use('/user/profile', isLoggedIn, userRoutes);
router.use('/user', userAuthRoutes);
router.use('/leaderboard', isLoggedIn, leaderboardRoutes);
router.use('/compete', isLoggedIn, simulationRoutes);


module.exports = router;
