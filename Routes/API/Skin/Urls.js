/**
 * Created by Indexyz on 2017/4/15.
 */
'use strict';
const express = require('express');
let router = express.Router();

router.get('/:username.json', require("./Profile").get);
router.get('/textures/:fileId', require("./File").get);
router.get('/skin/:username.png', require('./File').getSkin);
router.get('/uskin/:profileId.png', require('./File').getSkinByUUID);
router.get('/cap/:username.png', require('./File').getCup);

module.exports = router;
