
//  var chatRoutes = require('./chatServer.js');
const { app, server } =  require('./chatServer.js');
const chatRoutes = require('./chatServer.js').router;
const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');

mongoose.connect('mongodb://127.0.0.1:27017/chatDB').
  catch(error => handleError(error));


app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json());

app.use('/',chatRoutes);







server.listen(3000, ()=>{
console.log('listening on port 3000');
});





