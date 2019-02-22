const express = require('express');
const codeRoutes = require('./code');
const userAuthRoutes = require('./userAuth');
const userRoutes = require('./user');
const leaderboardRoutes = require('./leaderboard');
const simulationRoutes = require('./simulation');
const notificationRoutes = require('./notification');
const adminRoutes = require('./admin');
const matchRoutes = require('./match');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isAdmin = require('../middlewares/isAdmin');
const isActivated = require('../middlewares/isActivated');

const router = express.Router();

router.use('/code', isLoggedIn, codeRoutes);
router.use('/user/profile', isLoggedIn, userRoutes);
router.use('/user', userAuthRoutes);
router.use('/leaderboard', isLoggedIn, leaderboardRoutes);
router.use('/notifications', isLoggedIn, notificationRoutes);
router.use('/simulate', isLoggedIn, isActivated, simulationRoutes);
router.use('/admin', isLoggedIn, isAdmin, adminRoutes);
router.use('/match', isLoggedIn, matchRoutes);

module.exports = router;
