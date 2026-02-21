const express = require('express');
const router = express.Router();
const { getDocs } = require('../controllers/docs.controller');

router.get('/', getDocs);

module.exports = router;
