const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    username: String,
    currentRoom:[String],
    NotInRoom:[String],
    
});

// const Users = mongoose.model('Users', userSchema);

// module.exports = Users;
module.exports = mongoose.model('Users', userSchema);