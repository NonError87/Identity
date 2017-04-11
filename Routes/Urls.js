'use strict';
/**
 * Created by Indexyz on 2017/4/7.
 */
const express = require('express');
let router = express.Router();

router.get('/', (req, res, next) => {
    res.render('index')
});
router.use('/auth', require('./Auth/Urls'));
router.use('/member', require("./Member/Urls"));
router.use('/api', require("./API/Urls"));

module.exports = router;