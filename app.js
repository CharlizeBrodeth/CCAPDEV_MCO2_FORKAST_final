//Forkast server side 
//Install Command:
//npm init
//npm i express express-handlebars body-parser mongoose bcrypt express-session

//Set-up//
const express = require('express');  
const server = express(); 
const session = require('express-session');

server.use(session({
    secret:'secret-keyyy',
    resave:false,
    saveUninitialized:false,
    cookie: { secure: false }
}));


const bodyParser = require('body-parser');
server.use(express.json());
server.use(express.urlencoded({extended: true}));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs'
}));


const controllers = ['routes']; //ung mga get eme nasa controller
for(var i=0; i<controllers.length; i++){
  const model = require('./controllers/'+controllers[i]);
  model.add(server);
}

server.use(express.static('public'));
//End of set-up//


//Port//
const port = process.env.port || 3000;
server.listen(port, function(){
    console.log('listening at port' +port);
})
