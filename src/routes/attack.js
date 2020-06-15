const express = require('express')
const router = express.Router();

const pool = require('../database');

router.post('/:name', (req, res) => {
    res.status(200)
    const { name } = req.params;
    res.statusMessage = 'The battle is over';
    res.json('estas atacando a: ' + name);
});

module.exports = router;