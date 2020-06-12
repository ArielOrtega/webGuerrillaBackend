const sql = require('mssql');
const { promisify } = require('util');

const { database } = require('./keys');
const pool = sql.connect(database, function(err) {
  if (err){
    console.log(err)
  }else{
    console.log('Conectado a la BD')
  }
});

pool.query = promisify(pool.query);

module.exports = pool;