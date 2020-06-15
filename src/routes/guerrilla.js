const express = require('express')
const router = express.Router();
var sql = require('mssql');

const pool = require('../database');
const { request, json } = require('express');

//retorna info de todas las guerrillas
router.get('/', async (req, res) => {
    const request = pool.request()
    const data = await request.execute('GetGuerrillas');
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    output = parser(data)
    var objs = JSON.parse('[' + output.join(',') + ']');
    if (Object.keys(data.recordsets).length > 0) {
        res.status(200);
        res.statusMessage = 'Guerrillas found'
        res.json(objs);
    } else {
        res.status(404);
        res.statusMessage = 'Not found'
        res.json(objs);
    }
    res.status(400);
    res.statusMessage = 'Bad request'
});

//retorna la guerrilla pasada por parametro
router.get('/:name', async (req, res) => {
    const { name } = req.params;
    const request = pool.request()
    request.input('name', sql.VarChar, name)
    const data = await request.execute('GetGuerrilla');
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    output = parser(data)
    if (Object.keys(data.recordsets).length > 0) {
        res.status(200);
        res.statusMessage = 'Guerrilla found'
        console.log(output)
        res.json(JSON.parse(output));
    } else {
        res.status(404);
        res.statusMessage = 'Not found'
        res.json(output);
    }
    res.status(400);
    res.statusMessage = 'Bad request'
});

//inserta informacion de la guerrilla que posee el nombre del parametro
//retorna el json
router.post('/:name', async (req, res) => {
    const { name, email, faction } = req.body;
    const request = pool.request()
    const newGuerrilla = {
        name,
        email,
        faction
    }
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    request.input('name', sql.VarChar, newGuerrilla.name)
    request.input('email', sql.VarChar, newGuerrilla.email)
    request.input('faction', sql.VarChar, newGuerrilla.faction)
    await request.execute('insertGuerrilla', (err, result) => {
        if (err) {
            console.log(err)
        } else {
            console.log('exitoso!')
            console.log(parser(result))
            res.status(200);
            res.statusMessage = 'New guerrilla on the field'
            res.json(JSON.parse(parser(result)))
        }
    })
});

//Se utiliza para comprar unidades
router.put('/:name/units', async (req, res) => {
    const { name, units } = req.params;
    const { bunker } = req.body;
    //console.log(bunker)
    const request = pool.request()
    request.input('name', sql.VarChar, name)
    const data = await request.execute('GetGuerrilla');
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    output = parser(data)
    array = JSON.parse(output)
    console.log(array.army.assault)

    if (Object.keys(data.recordsets).length > 0) {
        res.status(200);
        res.statusMessage = 'successful transaction'
        res.json(JSON.parse(output));
    } else {
        res.status(404);
        res.statusMessage = 'Not found'
        res.json(output);
    }
    res.status(400);
    res.statusMessage = 'Bad request'
});

module.exports = router;

//remueve el root de json que implementa la consulta
function parser(data) {
    let newResults = [];
    for (let key in data) {
        if (key === "recordsets") {
            data[key].forEach(arr => {
                arr.forEach(obj => {
                    Object.keys(obj).forEach((key) => {
                        newResults.push(obj[key])
                    })
                });
            })
        }
    }
    return newResults
}