const express = require('express')
const router = express.Router();

const pool = require('../database');

router.post('/:name', (req, res) => {
    res.status(200)
    const { name } = req.params; //guerrilla por atacar
    const { nameSrc } = req.query.guerrillaSrc; //guerrilla que ataca
    
    res.statusMessage = 'The battle is over';
    res.json('estas atacando a: ' + name);
});

module.exports = router;