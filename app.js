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

server.use(express.static('public'));
//End of set-up//

//Connect to DB//
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Forkastdb');

// Password Hashing
const bcrypt = require('bcrypt');

// import validation helpers
const {validateEmail, validatePassword, allFieldsProvided} = require('./validationHelpers');

// create collection for available avatars 
const avatarSchema = new mongoose.Schema({
    avatar_name: {type: String},
    avatar_image: {type: String}
},{versionKey:false});


//avatar model
const avatarModel = mongoose.model('avatar', avatarSchema);

//create collection under Forkastdb//
const userSchema = new mongoose.Schema({
    fam_name: { type: String },
    first_name: { type: String },
    user_name: { type: String },
    screen_name: { type: String },
    bday: {type: Date},
    email: {type: String},
    password: {type: String},
    user_avatar: {type: String}
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
    rating: {type: Number},
    deleted: {type: Boolean}
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

        req.session.user = {
            id: user._id,
            user_name: user.user_name,
            user_email: user.email,
        };


        const restaurants = await restoModel.find({});
        let restoArray = restaurants.map(item => ({
            _id: item._id.toString(),
            resto_name: item.resto_name,
            resto_image: item.resto_image
        }));

        const logged_user = req.session.user.user_name;
        const searchUser = {user_name: logged_user}
        userModel.findOne(searchUser).then(function(user){
            resp.render('home',{
                layout: 'index-home',
                title: 'Forkast Home Page',
                resto_info: restoArray,       
                 user_name: user.user_name,
                user_avatar: user.user_avatar
                });
        }).catch(errorFn);

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
    avatarModel.find({}).then(function(avatars){
        console.log('Retrieving all avatars');
        let avatar_Array = [];

        for(const item of avatars){
            avatar_Array.push({
                avatar_name: item.avatar_name,
                avatar_image: item.avatar_image 
            });
        }
        //render the register.html
        resp.render('register',{
            layout: 'index',
             title: 'Register Page',
             avatar_info: avatar_Array
        });
    }).catch(errorFn);
});

//Adding a user to the DB//
server.post('/create_user', async function(req, resp){
    const requiredFields = ['fam_name', 'first_name', 'user_name', 'screen_name', 'bday', 'email', 'password', 'avatar_image'];
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
            password: hashedPassword, // hashed password in db
            user_avatar: req.body.avatar_image
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

//Render Home Page//
server.get('/home', async (req, resp) => {
    try {
        const restaurantName = req.query.name;

        const searchQuery = restaurantName ? { resto_name: { $regex: new RegExp(restaurantName, 'i') } } : {};

        const restaurants = await restoModel.find(searchQuery).lean();

        let restoArray = restaurants.map(item => ({
            resto_name: item.resto_name,
            resto_image: item.resto_image
        }));

        const logged_user = req.session.user.user_name;

        const searchUser = {user_name: logged_user}
        userModel.findOne(searchUser).then(function(user){
            resp.render('home',{
                layout: 'index-home',
                title: restaurantName ? 'Filtered Restaurant List' : 'Welcome to Forkast',
                resto_info: restoArray,
                user_name: user.user_name,
                user_avatar: user.user_avatar
            });
        }).catch(errorFn);

    } catch (error) {
        console.error('Error handling search request:', error);
        resp.status(500).render('error', { 
            layout: 'index-home',
            title: 'Error',
            error: 'An error occurred while searching for the restaurants.'
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
});

//Render View Profile//
server.get('/profile', function(req, resp){
    const logged_user = req.session.user.user_name;
    console.log(logged_user);

    const searchUser = {user_name: logged_user}

    userModel.findOne(searchUser).then(function(user){
        const searchReview = {user_name: user.user_name, deleted: {$ne: true}};

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
                user_reviews: reviews,
                user_avatar: user.user_avatar
            });
        }).catch(errorFn);
    }).catch(errorFn);
});

// edit user details//
server.get('/profile_edit', function(req, resp){
    const logged_user = req.session.user.user_name;

    avatarModel.find({}).then(function(avatars){
        console.log('Retrieving all avatars');
        let avatar_Array = [];

        for(const item of avatars){
            avatar_Array.push({
                avatar_name: item.avatar_name,
                avatar_image: item.avatar_image 
            });
        }

        const search_user = {user_name: logged_user};
        userModel.findOne(search_user).then(function(user){
            const user_email = user.email;
            const user_name = user.user_name;
            const screen_name = user.screen_name; 
            const user_avatar = user.user_avatar;

            //render the register.html
            resp.render('user_edit',{
                layout: 'index',
                title: 'Profile Edit Page',
                avatar_info: avatar_Array,
                user_name: user_name,
                screen_name: screen_name,
                user_avatar: user_avatar,
                user_email: user_email
            });
        }).catch(errorFn);
    }).catch(errorFn);
});

//update the profile//
server.post('/update_profile', async function(req, resp){
    const user_email = req.body.user_email;
    const new_userName = req.body.user_name;
    const new_screenName = req.body.screen_name;
    const new_avatar = req.body.avatar_image;

    try {
        const updateProfile = await userModel.findOneAndUpdate(
            {email: user_email},
            {
                $set: {
                    user_name: new_userName,
                    screen_name: new_screenName,
                    user_avatar: new_avatar
                }

            },
            {new: true}       
        );
        if(updateProfile){
            req.session.user.user_name = new_userName;
            //const logged_user = req.session.user.user_name;
            console.log('/profile');
            return resp.render('result', {
                layout: 'index',
                title: 'Result of Action',
                msg: 'profile successfully updated',
                btn_msg: 'return to profile',
                move_to: 'profile' 
            });
        } else{
            return resp.render('result', {
                layout: 'index',
                title: 'Result of Action',
                msg: 'Error updating profile details please try again...',
                btn_msg: 'Go back to home',
                move_to: 'home'
            });
        }
    } catch(error){
        console.error('Error updating user Profile', error);
        return resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'Error updating profile details please try again...',
            btn_msg: 'Go back to home',
            move_to: 'home'
        });
    }
    
});

//Render See Reviews of Restaurants//from home
server.get('/review_page/:name/', function(req, resp){
    const restoName = req.params.name;
    console.log(restoName);
    //find all reviews for the given resturant name
    const searchResto = {resto_name: restoName, deleted: {$ne: true}};

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

            const logged_user = req.session.user.user_name;
            const searchUser = {user_name: logged_user};
            userModel.findOne(searchUser).then(function(user){
                resp.render('reviews',{
                    layout: 'index-reviews',
                    title: 'Review Page'+ restoName,
                    reviews_list: reviews,
                    resto_image: restoImage,
                    restoName : restoName,
                    screen_name: user.user_name,
                    avatar: user.user_avatar
                });
            })
        }).catch(errorFn);
    }).catch(errorFn);
});

//Render create reviews
server.get('/create_review/:name', function(req, resp){
    const restoName = req.params.name;
    console.log(restoName);

    resp.render('create_review',{
        layout: 'index-create-review',
        title: 'Create Review for ' + restoName,
        resto_name: restoName,
        screen_name: global.loggedInUser
    });
});

server.post('/submit_review', async function(req, resp){
    const { resto_name, review_title, review_desc, rating } = req.body;

    if (!resto_name || !review_title || !review_desc || !rating) {
        return resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'All fields are required. Please try again.',
            btn_msg: 'Go back to Review',
            move_to: `create_review/${resto_name}`
        });
    }

    try {
        const reviewInstance = new resto_reviewModel({
            user_name: req.session.user.user_name, 
            resto_name,
            review_title,
            review_desc,
            rating,
            deleted: false 
        });

        await reviewInstance.save();

        resp.redirect(`/review_page/${encodeURIComponent(resto_name)}`);
    } catch (error) {
        console.error('Error submitting review:', error);
        resp.render('result', {
            layout: 'index',
            title: 'Error Submitting Review',
            msg: 'An error occurred while submitting your review. Please try again.',
            btn_msg: 'Go back to Review',
            move_to: `create_review/${resto_name}`
        });
    }
});

//Render upadate functions
server.get('/edit_review/:id', function(req, resp){
    const reviewId = req.params.id;
    console.log(reviewId);

    // Find the review by id
    resto_reviewModel.findById(reviewId).then(function(review){
        resp.render('edit_review',{
            layout: 'index-edit-review',
            title: 'Edit Review',
            review: review
        });
    }).catch(errorFn);
});
server.post('/submit_edit_review/:id', async function(req, resp){
    const reviewId = req.params.id;

    const updatedFields = {
        review_title: req.body.review_title,
        review_desc: req.body.review_desc,
        rating: req.body.rating
    };

    // Find the review by id and update it
    resto_reviewModel.findByIdAndUpdate(reviewId, updatedFields).then(function(review){
        resp.render('result', {
            layout: 'index',
            title: 'Result of Action',
            msg: 'Review updated successfully!',
            btn_msg: 'Go back to Home',
            move_to: 'home'
        });
    }).catch(errorFn);
});

// Delete
server.post('/delete_review/:id', async (req, res) => {
    const reviewId = req.params.id;
    try {
        const updatedReview = await resto_reviewModel.findByIdAndUpdate(reviewId, { $set: { deleted: true } }, { new: true });
        if (updatedReview) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Review not found' });
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//Logout//
server.get('/log-out', function(req, resp){
    if(req.session){
        req.session.destroy(function(err){
            if(err){
                console.log(err);
            }
            else{
                resp.render('start', {
                    layout: 'index',
                    title: 'Welcome to Forkast'
                });
            }
        })
    }
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
