const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const chatSchema = new Schema({

    roomMessage: [{
        Author: String,
        Comment: String, 
        createdAt:{type:Date, default:Date.now}
    }],
    roomName: String,
   

});


module.exports = mongoose.model('Chat', chatSchema);