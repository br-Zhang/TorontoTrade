const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    hash: String,
    salt: String,
    email: String,
});

userSchema.statics.getAllUsernames = function(name, cb) {
    return this.find({}).then(function(docs) {
        return res.json(docs.map(function(user) {
            return user._id;
        }));
    });
  };

module.exports = mongoose.model('User', userSchema);
