const express = require('express');
const morgan = require('morgan');
const app = express();
const mssql = require('mssql');

// settings
app.set('port', process.env.PORT || 4000);

// middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());


// routes
app.use(require('./routes'));
app.use('/guerrilla', require('./routes/guerrilla'));
//app.use('/attack', require('./routes/attack'));

// starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});