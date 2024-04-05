//Forkast server side 
//Install Command:
//npm init
//npm i express express-handlebars body-parser mongoose bcrypt express-session


const database = require('../models/database');

const userModel = database.userModel;
const restoModel = database.restoModel;
const resto_reviewModel = database.resto_reviewModel;
const avatarModel = database.avatarModel;

const fs = require('fs/promises');
async function importData() {
    try {
        // Read data from JSON files
        const userData = await fs.readFile('./Forkastdb.users.json', 'utf8');
        const restoData = await fs.readFile('./Forkastdb.restaurants.json', 'utf8');
        const resto_reviewData = await fs.readFile('./Forkastdb.resto_reviews.json', 'utf8');
        const avatarData = await fs.readFile('./Forkastdb.avatars.json', 'utf8');
        
        // Parse JSON data
        const users = JSON.parse(userData);
        const restaurants = JSON.parse(restoData);
        const reviews = JSON.parse(resto_reviewData);
        const avatars = JSON.parse(avatarData);
    

        // Check if data already exists in collections
        const existingUsers = await userModel.countDocuments();
        const existingRestaurants = await restoModel.countDocuments();
        const existingReviews = await resto_reviewModel.countDocuments();
        const existingAvatars = await avatarModel.countDocuments();
       

        // Insert data into MongoDB collections if they don't exist
        if (existingUsers === 0) {
            await userModel.insertMany(users);
            console.log('User accounts imported');
        }

        if (existingRestaurants === 0) {
            await restoModel.insertMany(restaurants);
            console.log('Restaurants imported');
        }

        if (existingReviews === 0) {
            await resto_reviewModel.insertMany(reviews);
            console.log('Reviews imported');
        }

        if (existingAvatars === 0) {
            await avatarModel.insertMany(avatars);
            console.log('Avatars imported');
        }


        console.log('Data import completed');
    } catch (error) {
        console.error('Error importing data:', error);
    }
}
importData();


//Set-up//
const express = require('express');  
const server = express(); 
const session = require('express-session');
// Password Hashing
const bcrypt = require('bcrypt');

const bodyParser = require('body-parser');
server.use(bodyParser.json());
server.use(express.json());
server.use(express.urlencoded({extended: true}));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs'
}));


const controllers = ['routes']; 
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
