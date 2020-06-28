const express = require('express')
const router = express.Router();
var sql = require('mssql');

const pool = require('../database');
const { request, json } = require('express');

//retorna info de todas las guerrillas
router.get('/', async (req, res) => {
    const { faction, email, name } = req.query;
    const request = pool.request()
    request.input('faction', sql.VarChar, faction)
    request.input('email', sql.VarChar, email)
    request.input('name', sql.VarChar, name)
    let data = ''
    if (typeof faction !== 'undefined' && typeof email !== 'undefined' && typeof name !== 'undefined') {
        request.input('flag', sql.Int, 0)
        data = await request.execute('GetGuerrillasParams');
    } else if (typeof faction == 'undefined' && typeof email !== 'undefined' && typeof name !== 'undefined') {
        request.input('flag', sql.Int, 2)
        data = await request.execute('GetGuerrillasParams');
    } else if (typeof faction == 'undefined' && typeof email == 'undefined' && typeof name !== 'undefined') {
        request.input('flag', sql.Int, 4)
        data = await request.execute('GetGuerrillasParams');
    } else if (typeof faction == 'undefined' && typeof email == 'undefined' && typeof name == 'undefined') {
        request.input('flag', sql.Int, 7)
        data = await request.execute('GetGuerrillasParams');
    } else if (typeof faction !== 'undefined' && typeof email !== 'undefined' && typeof name == 'undefined') {
        request.input('flag', sql.Int, 1)
        data = await request.execute('GetGuerrillasParams');
    } else if (typeof faction !== 'undefined' && typeof email == 'undefined' && typeof name == 'undefined') {
        request.input('flag', sql.Int, 5)
        data = await request.execute('GetGuerrillasParams');
    } else if (typeof faction == 'undefined' && typeof email !== 'undefined' && typeof name == 'undefined') {
        request.input('flag', sql.Int, 6)
        data = await request.execute('GetGuerrillasParams');
    }else if (typeof faction !== 'undefined' &&typeof email == 'undefined' && typeof name !== 'undefined') {
        request.input('flag', sql.Int, 3)
        data = await request.execute('GetGuerrillasParams');
    }
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
    const {  email, faction } = req.body;
    const request = pool.request()
    const { name } = req.params;
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
    if (resources.moneyRequired <= array.resources.money && resources.oilRequired <= array.resources.oil &&
        resources.peopleRequired <= array.resources.people) {
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
        res.statusMessage = 'Successful transaction'
        res.json(JSON.parse(parser(updatedGuerrilla)))
    } else {
        console.log('fondos insuficientes')
        res.status(402)
        res.statusMessage = 'Non-sufficient funds'
        res.json(array)
    }
    res.status(400);
    res.statusMessage = 'Bad request'
});

router.post('/attack/:name', async(req, res) => {
    res.status(200)
    const { name } = req.params; //guerrilla por atacar
    const { guerrillaSrc } = req.query; //guerrilla que ataca   

    //ATACANTE 
    const request = pool.request() 
    request.input('name', sql.VarChar, guerrillaSrc) 
    const dataAtacante = await request.execute('GetGuerrilla');
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    outputAtacante = parser(dataAtacante)
    arrayAtacante = JSON.parse(outputAtacante)
    //console.log(arrayAtacante.army.assault) 
    numAssault=arrayAtacante.army.assault;
    numEngineer=arrayAtacante.army.engineer;
    numTank=arrayAtacante.army.tank;
    numBunker=arrayAtacante.buildings.bunker;
    petroleoAtacante = arrayAtacante.resources.oil;
    DineroAtacante = arrayAtacante.resources.money;
    rankAtacante = arrayAtacante.rank;
    /*console.log('Assault: '+numAssault);
    console.log(numEngineer);
    console.log(numTank);
    console.log(numBunker);*/

    //ATACADO
    const request2 = pool.request()
    request2.input('name', sql.VarChar, name)
    const dataAtacado = await request2.execute('GetGuerrilla');
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    outputAtacado = parser(dataAtacado)
    arrayAtacado = JSON.parse(outputAtacado)
    //console.log(arrayAtacado.army.assault)
    numBunkerAtacado= arrayAtacado.buildings.bunker;
    numTankAtacado=arrayAtacado.army.tank;
    numEngineerAtacado=arrayAtacado.army.engineer;
    numAssaultAtacado=arrayAtacado.army.assault;
    petroleoAtacado = arrayAtacado.resources.oil;
    DineroAtacado = arrayAtacado.resources.money;
    rankAtacado = arrayAtacado.rank;
/*
    console.log('Bunker: '+numBunkerAtacado); //
    console.log(' : '+numTankAtacado);
    console.log(numEngineerAtacado);
    console.log(numAssaultAtacado);
    console.log(petroleoAtacodo);
    console.log(DineroAtacodo);
 */
 
//atacante
    //atacar bunker 
    PA_Bunker=(numAssault*0.05)+(numEngineer*0.9)+(numTank*1)+(numBunker*0);

    //calcular unidades restantes
    defenzaBunker=numBunkerAtacado*600;
    if(PA_Bunker>defenzaBunker){
        URA_Bunker=0;
    }else{
        resultBunker=defenzaBunker-PA_Bunker;
        URA_Bunker=Math.round(resultBunker/600); //redondear al numero menor
    }

    //atacar tank
    PA_Tank=(numAssault*0.1)+(numEngineer*0.9)+(numTank*0.6)+(numBunker*0.9);

    //calcular unidades restantes
    defenzaTank=numTankAtacado*20;
    if(PA_Tank>defenzaTank){
        URA_Tank=0;
    }else{
        resultTank=defenzaTank-PA_Tank;
        URA_Tank=Math.round(resultTank/20);//redondear al numero menor
    }

    //atacar engineer
    PA_Engineer=(numAssault*0.8)+(numEngineer*0.5)+(numTank*5)+(numBunker*5);

    //calcular unidades restantes
    defenzaEngineer=numEngineerAtacado*70;
    if(PA_Engineer>defenzaEngineer){
        URA_Engineer=0;
    }else{
        resultEngineer=defenzaEngineer-PA_Engineer;
        URA_Engineer=Math.round(resultEngineer/70); //redondear al numero menor
    }

    //atacar Assault
    PA_Assault=(numAssault*0.5)+(numEngineer*0.3)+(numTank*5)+(numBunker*5);

    //calcular unidades restantes
    defenzaAssault=numAssaultAtacado*80;
    if(PA_Assault>defenzaAssault){
        URA_Assault=0;
    }else{
        resultAssault=defenzaAssault-PA_Assault;
        URA_Assault=Math.round(resultAssault/80); //redondear al numero menor
    }

    console.log('ATACANTE')
    console.log('PA_Bunker :'+ PA_Bunker);
    console.log('defenzaBunker :'+ defenzaBunker)
    console.log('URA_Bunker :'+ URA_Bunker)

    console.log('PA_AS :'+ PA_Assault);
    console.log('defenzaAsa :'+ defenzaAssault)
    console.log('URA_Assa :'+ URA_Assault)

    console.log('PA_TANK :'+ PA_Tank);
    console.log('defenzaTAN :'+ defenzaTank)
    console.log('URA_TAN :'+ URA_Tank)

    console.log('PA_Enner :'+ PA_Engineer);
    console.log('defenzaEnner :'+ defenzaEngineer)
    console.log('URA_Enner :'+ URA_Engineer)
 
  

//ATACADO
    //URAtacante = unidad restante atacante 

    //atacar bunker 
    PA_Bunker=(numAssaultAtacado*0.05)+(numEngineerAtacado*0.9)+(numTankAtacado*1)+(numBunkerAtacado*0);

    //calcular unidades restantes
    defenzaBunker=numBunker*600;
    if(PA_Bunker>defenzaBunker){
        URAtacanteBunker=0;
    }else{
        result=defenzaBunker-PA_Bunker;
        URAtacanteBunker=Math.round(result/600); //redondear al numero menor
    }

    //atacar tank
    PA_Tank=Math.round((numAssaultAtacado*0.1)+(numEngineerAtacado*0.9)+(numTankAtacado*0.6)+(numBunkerAtacado*0.9));

    defenzaTank=numTank*20

    if(PA_Tank>defenzaTank){ 
        URAtacanteTank=0;
    }else{
        result=defenzaTank-PA_Tank;
        URAtacanteTank=Math.round(result/20); //redondear al numero menor
    }
    //atacar engineer
    PA_Engineer=(numAssaultAtacado*0.8)+(numEngineerAtacado*0.5)+(numTankAtacado*5)+(numBunkerAtacado*5);

    defenzaEngineer=numEngineer*70
    if(PA_Engineer>defenzaEngineer){
        URAtacanteEngineer=0;
    }else{
        result=defenzaEngineer-PA_Engineer;
        URAtacanteEngineer=Math.round(result/70); //redondear al numero menor
    }

    //atacar Assault
    PA_Assault=(numAssaultAtacado*0.5)+(numEngineerAtacado*0.3)+(numTankAtacado*5)+(numBunkerAtacado*5);

    defenzaAssault=numAssault*80
    if(PA_Assault>defenzaAssault){
        URAtacanteAssault=0;
    }else{
        result=defenzaAssault-PA_Assault;
        URAtacanteAssault=Math.round(result/80); //redondear al numero menor
    }

    console.log('ATACADO')
    console.log('PA_Bunker :'+ PA_Bunker);
    console.log('defenzaBunker :'+ defenzaBunker)
    console.log('URAtacanteBunker :'+ URAtacanteBunker)

    console.log('PA_AS :'+ PA_Assault);
    console.log('defenzaAsa :'+ defenzaAssault)
    console.log('URAtacanteAssault :'+ URAtacanteAssault)

    console.log('PA_TANK :'+ PA_Tank);
    console.log('defenzaTAN :'+ defenzaTank)
    console.log('URAtacanteTank :'+ URAtacanteTank)

    console.log('PA_Enner :'+ PA_Engineer);
    console.log('defenzaEnner :'+ defenzaEngineer)
    console.log('URAtacanteEngineer :'+ URAtacanteEngineer)

    //Poder Ofensa y defensa 
    PoderOfensa=(numAssault*80)+(numEngineer*30)+(numTank*500)+(numBunker*0);
    PoderDefensa=(numAssaultAtacado*20)+(numEngineerAtacado*70)+(numTankAtacado*20)+(numBunkerAtacado*600);
    totalPoder=(PoderOfensa)+(PoderDefensa); 
    aD=PoderOfensa/totalPoder;
    Ai=aD+0.1;
    oD=PoderDefensa/totalPoder;
    Di=oD+0.1;

    if (PoderOfensa>PoderDefensa){  //gana atacante
        rankAtacante= rankAtacante + 10;
    }
    else if(PoderOfensa<PoderDefensa){ //gana atacado
        rankAtacado= rankAtacado + 10;
    }
    else{                               //quedan empate
        rankAtacante= rankAtacante + 5;
        rankAtacado= rankAtacado + 5;
    }
    
    console.log('PoderOfensa :'+ PoderOfensa)
    console.log('PoderDefensa :'+ PoderDefensa)
    console.log('totalPoder :'+ totalPoder)
    console.log('Ai :'+ Ai)
    console.log('Di :'+ Di)

    //pillaje
    loot=(25*URA_Assault)+(60*URA_Engineer)+(200*URA_Tank);

    //Math.random() * (max - min) + min
    Aleatorio = Math.round(Math.random() * (100 - 1) + 1);
    Petroleo= Math.round( (Aleatorio*0.01)*loot );
    Dinero= (loot)-(Petroleo); 

    console.log('loot :'+ loot)
    console.log('Aleatorio :'+ Aleatorio)
    console.log('Petroleo :'+ Petroleo)
    console.log('Dinero :'+ Dinero)

    if(Petroleo>petroleoAtacado){
        petroleoAtacante=petroleoAtacante+petroleoAtacado;  
        petroleoAtacado=0;
    }else if(Petroleo<petroleoAtacado){
        petroleoAtacado=petroleoAtacado-Petroleo;
        petroleoAtacante=Petroleo+petroleoAtacante;   //petroleoAtacante
    }

    if(Dinero>DineroAtacado){
        DineroAtacante=DineroAtacante+DineroAtacado;
        DineroAtacado=0;
    }else if(Dinero<DineroAtacado){
        DineroAtacado=DineroAtacado-Dinero;
        DineroAtacante= Dinero + DineroAtacante;
    }

    console.log('loot :'+ loot)
    console.log('Aleatorio :'+ Aleatorio)
    console.log('petroleoAtacante :'+ petroleoAtacante)
    console.log('DineroAtacante :'+ DineroAtacante)
    
    console.log('petroleoAtacado :'+ petroleoAtacado)
    console.log('DineroAtacado :'+ DineroAtacado)


    if(name!='' && guerrillaSrc!=''){
//Atacante
        //URA_Bunker  URA_Assault URA_Tank  URA_Engineer
        
    const request2 = pool.request()
    request2.input('name', sql.VarChar, guerrillaSrc)

    request2.input('money', sql.Int, DineroAtacante)
    request2.input('oil', sql.Int, petroleoAtacante)
    request2.input('rank', sql.Int, rankAtacante)

    request2.input('assault', sql.Int, URA_Assault)
    request2.input('tank', sql.Int, URA_Tank)
    request2.input('engineer', sql.Int, URA_Engineer)
    request2.input('bunker', sql.Int, URA_Bunker)
    const updatedGuerrillaAtacante = await request2.execute('updateAttack')
    console.log(updatedGuerrillaAtacante)
    res.status(200) 
    res.statusMessage = 'The battle is over'; 
    //res.json(JSON.parse(parser(updatedGuerrillaAtacante)))

//Atacado
         //URAtacanteBunker URAtacanteAssault  URAtacanteTank URAtacanteEngineer
    const request3 = pool.request()
    request3.input('name', sql.VarChar, name)

    request3.input('money', sql.Int, DineroAtacado)
    request3.input('oil', sql.Int, petroleoAtacado)
    request3.input('rank', sql.Int, rankAtacado)

    request3.input('assault', sql.Int, URAtacanteAssault)
    request3.input('tank', sql.Int, URAtacanteTank)
    request3.input('engineer', sql.Int, URAtacanteEngineer)
    request3.input('bunker', sql.Int, URAtacanteBunker)
    const updatedGuerrillaAtacado = await request3.execute('updateAttack')
    console.log(updatedGuerrillaAtacado)
    res.status(200)
    res.statusMessage = 'The battle is over'; 
    //res.json(JSON.parse(parser(updatedGuerrillaAtacado)))

    res.statusMessage = 'The battle is over'; 
    //res.json('estas atacando a: ' + name + ',  nameSrc: '+guerrillaSrc); 
    results = JSON.parse(parser(updatedGuerrillaAtacante));
    guerrillas = arrayAtacante
    salida = {
        guerrillas: [guerrillas],
        results: [results]
    }
    res.json(salida)
    }
    else{
        res.status(404);
    res.statusMessage = 'Not found'
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

function calculateBuy(assault, engineer, tank, bunker) {
    resources = {
        moneyRequired: 0,
        oilRequired: 0,
        peopleRequired: 0
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