//Forkast server side 
//Install Command:
//npm init
//npm i express express-handlebars body-parser mongoose bcrypt

//Set-up//
const express = require('express');  
const server = express(); 

const bodyParser = require('body-parser');
server.use(express.json());
server.use(express.urlencoded({extended: true}));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs'
}));

server.use(express.static('public'));
//End of set-up//

//Connect to DB//
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Forkastdb');

// Password Hashing
const bcrypt = require('bcrypt');

// import validation helpers
const {validateEmail, validatePassword, allFieldsProvided} = require('./validationHelpers');

//create collection under Forkastdb//
const userSchema = new mongoose.Schema({
    fam_name: { type: String },
    first_name: { type: String },
    user_name: { type: String },
    screen_name: { type: String },
    bday: {type: Date},
    email: {type: String},
    password: {type: String}
  },{ versionKey: false });


//create model for collection//
const userModel = mongoose.model('user', userSchema);

//create collection for restaurants//
const restoSchema = new mongoose.Schema({
    resto_name: {type: String},
    resto_image: {type:String},
},{versionKey: false});

//model for resto collection//
const restoModel = new mongoose.model('restaurant', restoSchema);


const resto_reviewSchema = new mongoose.Schema({
    user_name: {type: String},
    resto_name: {type: String},
    review_title: {type: String},
    review_desc: {type: String},
    rating: {type: Number}
},{versionKey: false});


const resto_reviewModel = new mongoose.model('resto_reviews', resto_reviewSchema);


function errorFn(err){
    console.log('Error fond. Please trace!');
    console.error(err);
}

//Render Home page (start)//
server.get('/', function(req, resp){
    //render the home.html
    resp.render('start', {
        layout: 'index',
        title: 'Welcome to Forkast'
    });
});

//Render Login page//
server.get('/login/', function(req, resp){
    //render the login.html
    resp.render('login',{
        layout: 'index',
        title: 'Login Page'
    });
});

global.loggedInUser = '';

//Accepting login//
server.post('/check_login', async function(req, resp){
    const { email, password } = req.body;

    try {
        // find by email
        const user = await userModel.findOne({ email: email });
        if (!user) {
            return resp.render('result', {
                layout: 'index',
                title: 'Login Error',
                msg: 'Sorry! Wrong email or password, please try again',
                btn_msg: 'Go back to Login',
                move_to: 'login'
            });
        }

        // compare pass and hashed pass
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return resp.render('result', {
                layout: 'index',
                title: 'Login Error',
                msg: 'Sorry! Wrong email or password, please try again',
                btn_msg: 'Go back to Login',
                move_to: 'login'
            });
        }

        global.loggedInUser = user.screen_name;

        const restaurants = await restoModel.find({});
        let restoArray = restaurants.map(item => ({
            _id: item._id.toString(),
            resto_name: item.resto_name,
            resto_image: item.resto_image
        }));
    
        resp.render('home',{
            layout: 'index-home',
            title: 'Forkast Home Page',
            resto_info: restoArray,
            screen_name: global.loggedInUser
        });
    } catch (error) {
        console.error('Login error:', error);
        resp.render('result', {
            layout: 'index',
            title: 'Login Error',
            msg: 'An error occurred during login. Please try again.',
            btn_msg: 'Go back to Login',
            move_to: 'login'
        });
    }
});


//Render Register page//
server.get('/register/', function(req, resp){
    //render the register.html
    resp.render('register',{
        layout: 'index',
        title: 'Register Page'
    });
});

//Adding a user to the DB//
server.post('/create_user', async function(req, resp){
    const requiredFields = ['fam_name', 'first_name', 'user_name', 'screen_name', 'bday', 'email', 'password'];
    if (!allFieldsProvided(req.body, requiredFields)) {
        return resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'All fields are required. Please try again.',
            btn_msg: 'Go back to Registration',
            move_to: 'register'
        });
    }

    if (!validateEmail(req.body.email)) {
        return resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'Invalid email format. Please try again.',
            btn_msg: 'Go back to Registration',
            move_to: 'register'
        });
    }

    if (!validatePassword(req.body.password)) {
        return resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'Password must be at least 8 characters long and include one special character.',
            btn_msg: 'Go back to Registration',
            move_to: 'register'
        });
    }

    // checks for exisitng username and emal
    const existingUser = await userModel.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.email }] });
    if (existingUser) {
        return resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'Username or email already exists. Please try a different one.',
            btn_msg: 'Go back to Registration',
            move_to: 'register'
        });
    }
    
    try {
        // hash rounds
        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        // creates new used in db
        const newUser = {
            fam_name: req.body.fam_name,
            first_name: req.body.first_name,
            user_name: req.body.user_name,
            screen_name: req.body.screen_name,
            bday: req.body.bday,
            email: req.body.email,
            password: hashedPassword // hashed password in db
        };

        // saves to db
        await new userModel(newUser).save();

        resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'Successfully Registered! Please Proceed to Login',
            btn_msg: 'Proceed to Login',
            move_to: 'login'
        });
    } catch (error) {
        console.error('Error creating user:', error);
        resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'An error occurred during registration. Please try again.',
            btn_msg: 'Go back to Registration',
            move_to: 'register'
        });
    }
});


    //Render Search Page//
    server.get('/search/', function(req, resp){
        restoModel.find({}).then(function(restaurant){
            let restoArray = [];

            for(const item of restaurant){
                restoArray.push({
                    resto_name: item.resto_name,
                    resto_image: item.resto_image
                });
            }

            resp.render('search',{
                layout: 'index-search',
                title: 'Create Review Page',
                restos: restoArray
            });
        }).catch(errorFn);
        //render the search-page.html
    });


//Render View Profile//
server.get('/profile/:name', function(req, resp){
    const user = req.params.name;
    console.log(user);

    const searchUser = {screen_name: user}

    userModel.findOne(searchUser).then(function(user){
        const searchReview = {user_name: user.user_name}

        resto_reviewModel.find(searchReview).then(function(resto_reviews){
            console.log('Retrieving all reviews of the user');
            let reviews = [];
            for(const item of resto_reviews){
                reviews.push({
                    user_name: item.user_name,
                    resto_name: item.resto_name,
                    review_title: item.review_title,
                    review_desc: item.review_desc,
                    rating: item.rating
                });
            }

            resp.render('users',{
                layout: 'index-users',
                title: 'Profile' + user.screen_name,
                profile_name: user.first_name + " " + user.fam_name,
                user_handle: user.user_name,
                user_screen: user.screen_name,
                user_reviews: reviews
            });
        }).catch(errorFn);
    }).catch(errorFn);
});

//Render See Reviews of Restaurants//from home
server.get('/review_page/:name/', function(req, resp){
    const restoName = req.params.name;
    console.log(restoName);
    //find all reviews for the given resturant name
    const searchResto = {resto_name: restoName};

    //get image of restuarant
    restoModel.findOne(searchResto).then(function(restaurant){
        const restoImage = restaurant.resto_image;

        //get all reviews of that restaurant
        resto_reviewModel.find(searchResto).then(function(resto_reviews){
            console.log('Retrieving all reviews of the restaurant');
            let reviews = [];
            for(const item of resto_reviews){
                reviews.push({
                    user_name: item.user_name,
                    resto_name: item.resto_name,
                    review_title: item.review_title,
                    review_desc: item.review_desc,
                    rating: item.rating
                });
            }
            resp.render('reviews',{
                layout: 'index-reviews',
                title: 'Review Page'+ restoName,
                reviews_list: reviews,
                resto_image: restoImage,
                restoName : restoName,
                screen_name: global.loggedInUser
            });
        }).catch(errorFn);
    }).catch(errorFn);
});


//Close DB//
function finalClose(){

    console.log('Close connection at the end!');
    mongoose.connection.close();
    process.exit();
}

process.on('SIGTERM',finalClose);  //general termination signal
process.on('SIGINT',finalClose);   //catches when ctrl + c is used
process.on('SIGQUIT', finalClose); //catches other termination commands


//Port//
const port = process.env.port || 3000;
server.listen(port, function(){
    console.log('listening at port' +port);
})
