//Connect to DB//
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Forkastdb');


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
    user_avatar: {type: String},
    isDeleted: {type: Boolean}
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
    user_email: {type: String},
    resto_name: {type: String},
    review_title: {type: String},
    review_desc: {type: String},
    rating: {type: Number},
    like_array: [String],
    dislike_array: [String],
    deleted: {type: Boolean}
},{versionKey: false});


const resto_reviewModel = new mongoose.model('resto_reviews', resto_reviewSchema);

module.exports.avatarModel = avatarModel;
module.exports.userModel = userModel;
module.exports.resto_reviewModel = resto_reviewModel;
module.exports.restoModel = restoModel;