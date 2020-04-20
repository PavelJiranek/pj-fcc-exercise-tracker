const mongoose = require("mongoose");
const shortId = require('shortid');

const utils = require('./utils');

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});


const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: {
        'type': String,
        'default': shortId.generate,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
});

// Et - Exercise tracker
const User = mongoose.model("EtUser", userSchema);

const exerciseSchema = new Schema({
    userId: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Exercise = mongoose.model("EtExercise", exerciseSchema);

const createUser = username => new User({ username });

const defaultDoneCallback = done => (err, data) => {
    if (err) return done(err);
    done(null, data);
};

const saveUser = function (user, done) {
    user.save(defaultDoneCallback(done));
};

const findUserById = (userId, done) => {
    User.findById(userId, 'username __id', defaultDoneCallback(done));
};

/**
 * @param user - user object from User model via createUser()
 * @param res - response object
 * @param next - server's next() handler
 */
const saveAndSendUser = function (user, res, next) {
    saveUser(user, (err, userData) => {
        if (err) {
            const errMessage = utils.isMongoDupeKeyErr(err) ? 'User already exists, please select a different username.'
                : `Error when saving user:\n${err.errmsg}`;
            return next(errMessage);
        }
        findUserById(utils.getUserId(userData), (err, savedUserData) => {
            if (err) {
                return next(`Created user not found with error:\n${err}`);
            }
            res.json(savedUserData)
        })
    })
};

const getAllUsers = done => {
    User.find({}, 'username __id', defaultDoneCallback(done));
};

const removeUsers = (done, userSelect = {}) => {
    User.deleteMany(userSelect, defaultDoneCallback(done));
};

module.exports = {
    createUser,
    saveAndSendUser,
    getAllUsers,
    removeUsers,
};
