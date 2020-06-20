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
    const { name } = req.params;
    const { assault, engineer, tank, bunker } = req.body;
    const request = pool.request()
    request.input('name', sql.VarChar, name)
    const data = await request.execute('GetGuerrilla');
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    output = parser(data)
    array = JSON.parse(output)
    resources = calculateBuy(assault, engineer, tank, bunker);
    if( resources.moneyRequired <= array.resources.money && resources.oilRequired <= array.resources.oil && 
        resources.peopleRequired <= array.resources.people){
        console.log('compra realizada')
        const request2 = pool.request()
        request2.input('name', sql.VarChar, name)
        request2.input('money', sql.Int, resources.moneyRequired)
        request2.input('oil', sql.Int, resources.oilRequired)
        request2.input('people', sql.Int, resources.peopleRequired)
        request2.input('assault', sql.Int, assault)
        request2.input('tank', sql.Int, tank)
        request2.input('engineer', sql.Int, engineer)
        request2.input('bunker', sql.Int, bunker)
        const updatedGuerrilla = await request2.execute('updateResources')
        console.log(updatedGuerrilla)
        res.status(200)
        res.statusMessage='Successful transaction'
        res.json(JSON.parse(parser(updatedGuerrilla)))
    }else{
        console.log('fondos insuficientes')
        res.status(402)
        res.statusMessage = 'Non-sufficient funds'
        res.json(array)
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

function calculateBuy(assault, engineer, tank, bunker){
    resources = {
        moneyRequired:0,
        oilRequired:0,
        peopleRequired:0
    }
    //recursos requeridos para los asalto
    for (let i = 0; i < assault; i++) {
        resources.moneyRequired += 20
        resources.oilRequired += 25
        resources.peopleRequired += 1
    }
    //recursos requeridos para los ingenieros
    for (let i = 0; i < engineer; i++) {
        resources.moneyRequired += 10
        resources.oilRequired += 25
        resources.peopleRequired += 1
    }
    //recursos requeridos para los tanques
    for (let i = 0; i < tank; i++) {
        resources.moneyRequired += 200
        resources.oilRequired += 500
        resources.peopleRequired += 8
    }
    //recursos requeridos para los bunker
    for (let i = 0; i < bunker; i++) {
        resources.moneyRequired += 300
        resources.oilRequired += 200
        resources.peopleRequired += 8
    }
    return resources;
}