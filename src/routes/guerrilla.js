const express = require('express')
const router = express.Router();
var sql = require('mssql');

const pool = require('../database');
const request = pool.request()

//retorna info de todas las guerrillas
router.get('/', async (req, res) => {
    const data = await pool.query('Select * from Guerrilla');
    res.header("Access-Control-Allow-Origin", req.get("Origin")||"*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(data);
});

router.get('/:name', async (req, res) => {
    const { name } = req.params;
    request.input('name', sql.VarChar, name)
    const data = await request.query('Select * from Guerrilla WHERE name = @name');
    res.status(200);
    res.statusMessage = 'Guerrilla found'
    res.json(data);
});

//inserta informacion de la guerrilla que posee el nombre del parametro
router.post('/:name', async (req, res) => {
    const { name, email, faction } = req.body;
    const newGuerrilla = {
        name,
        email,
        faction
    }
    
    request.input('name', sql.VarChar, newGuerrilla.name)
    request.input('email', sql.VarChar, newGuerrilla.email)
    request.input('faction', sql.VarChar, newGuerrilla.faction)
    await request.query('insert into Guerrilla (name, email, faction) values (@name, @email, @faction)', (err, result) => {
        if (err){
            console.log(err)
        }else{
            res.status(200);
            res.statusMessage ='New guerrilla on the field'
            const data = request.query('Select * from Guerrilla WHERE name = @name');
            res.json(data)
        }
    })
});

//Se utiliza para comprar unidades
router.put('/:name/units', async (req, res) => {
    const data = await pool.query('Select * from Guerrilla');
    res.json(data);
});

module.exports = router;