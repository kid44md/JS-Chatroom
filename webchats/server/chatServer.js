const express = require('express');
const app = express();
const router = express.Router();
const {
    createServer
} = require('node:http');
const server = createServer(app);
const {
    Server
} = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: ["https://localhost:3000"],
        methods: ['GET', 'POST']
    }
});
/* this will hold all of the users, including the names and socket id
this will be used later to create private messaging */
var arrayOfUsers = [];
const usersDatabase = require('./database/usernameDb.js');
const chatDatabase = require('./database/chatDb.js');


router.get('/api/', findNow);
router.get('/api/getChats/:room', getChats)


async function getChats(request, response) {
    console.log(request.params);
    console.log("params");
    try {
        let user = await chatDatabase.aggregate([{
            $match: {
                roomName: request.params.room
            }
        }, {
            /* $project is like the select, you can hide certain fields of the document that you don't want to see but you are able to add
            fields that don't exist like in this instance "results"  */
            $project: {
                results: {
                    /* input is the array and im sorting the array by the date to display the most recent message should be display at the top  */
                    $sortArray: {
                        input: "$roomMessage",
                        sortBy: {
                            createdAt: -1
                        }
                    }
                }
            }
        }]);
        response.send(user);
    } catch (e) {
        console.log(e.message);
    }
}

async function findNow(request, response) {
    let user = await chatDatabase.aggregate([{
        $match: {
            roomName: "room2"
        }
    }, {
        /* $project is like the select, you can hide certain fields of the document that you don't want to see but you are able to add
        fields that don't exist like in this instance "results"  */
        $project: {
            results: {
                /* input is the array and im sorting the array by the date to display the most recent message should be display at the top  */
                $sortArray: {
                    input: "$roomMessage",
                    sortBy: {
                        createdAt: -1
                    }
                }
            }
        }
    }]);
    response.send(user);
}

io.on('connection', (socket) => {
    console.log('user is connected ' + socket.id);
    socket.on('chat message', (msg, username, rooms, currentRoom) => {
        /* this will hold the username and socket id  */
        socket.to(currentRoom).except(rooms).emit('chat message', username, msg);
        storeMessage(username, msg, currentRoom); //storing the message in the database 
    });

    socket.on('user-typing', (username, rooms, room) => {
        /* Sets a modifier for a subsequent event emission that the event will only be broadcast to clients that have not joined the given rooms */
        // socket.except(rooms).emit('user-typing', username);
        socket.to(room).except(rooms).emit('user-typing', username);
        //user typing notification will be sent to this room only and wont be broadcast 
        //to people outside the room
    });

    socket.on('stop-typing', (username, rooms, room) => {
        socket.to(room).except(rooms).emit('stop-typing', username);
    });


    socket.on('join-room', (room, username, notInRooms) => {
        socket.join(room);
        console.log(socket.rooms)
        console.log(notInRooms)
        socket.username = username;
        arrayOfUsers.push({
            username: socket.username,
            socket: socket.id
        });
        console.log(arrayOfUsers);


        createSession(usersDatabase, socket, room, notInRooms, chatDatabase);
    });

    socket.on('private connection', (sender, recipient) => {
        for (let i = 0; i < arrayOfUsers.length; i++) {
            if (arrayOfUsers[i].username == recipient) {
                socket.to(arrayOfUsers[i].socket).emit('connecting to other user', sender);
            }
        }
    });


    socket.on('sending private message', (sender, message, recipient) => {
        for (let i = 0; i < arrayOfUsers.length; i++) {
            if (arrayOfUsers[i].username == recipient) {
                socket.to(arrayOfUsers[i].socket).emit('New Message', sender, message)
            }
        }
    });

    socket.on('private user is typing', (sender, recipient)=>{
        /* object destructing */
        let {privateUsername} = recipient;
        for (let i = 0; i < arrayOfUsers.length; i++) {
            if (arrayOfUsers[i].username == privateUsername) {
                socket.to(arrayOfUsers[i].socket).emit('private user is typing', sender);
            }
        }
    });

    socket.on('private user stop typing', (sender, recipient)=>{
        for (let i = 0; i < arrayOfUsers.length; i++) {
            if (arrayOfUsers[i].username == recipient) {
                socket.to(arrayOfUsers[i].socket).emit('private user stop typing', sender);
            }
        }
    });
   

    socket.on('user close private chat', (sender, recipient)=>{
        for (let i = 0; i < arrayOfUsers.length; i++) {
            if (arrayOfUsers[i].username == recipient) {
                socket.to(arrayOfUsers[i].socket).emit('left private chat', sender);
            }
        }
    })

    socket.on('disconnect', () => {
        // console.log(socket.username + `disconnected`);
        // console.log(socket.id + `disconnected`);
        disconnect(socket.username);
    });

});


async function createSession(usersDatabase, socket, room, notInRooms, chatDatabase) {
    try {
        /* checking if the user is in the database and if the user is not in the database, create a document for him
        then checking to see if the chat room is empty or not.
        will add a system to the database. On the front end we will make an API call to grab data from the database base on the room.
        */
        let foundUser = await usersDatabase.findOne({
            username: socket.username
        });
        if (!foundUser) {
            await usersDatabase.create({
                username: socket.username,
                currentRoom: room,
                NotInRoom: notInRooms
            });
            //get all of the users online in that room
            let OnlineUsers = await usersDatabase.find({
                currentRoom: room
            }).select("-currentRoom -NotInRoom");
            let foundChatMessages = await chatDatabase.findOne({
                roomName: room
            });
            if (!foundChatMessages) {
                /* going to create a system message that will tell everyone that the user has enter the room */
                await chatDatabase.create({
                    roomMessage: [{
                        Author: "System",
                        Comment: `${socket.username} has entered the room`
                    }],
                    roomName: room
                });
                io.to(room).except(notInRooms).emit('online list', OnlineUsers);
            } else {
                await chatDatabase.findOneAndUpdate({
                    roomName: room
                }, {
                    $push: {
                        roomMessage: {
                            Author: "System",
                            Comment: `${socket.username} has entered the room`
                        }
                    }
                });
                io.to(room).except(notInRooms).emit('online list', OnlineUsers);
            }
        } else if (foundUser.currentRoom.length == 0) {
            /* this is for re-occurring users in the database  */
            console.log(`HERE`);
            await usersDatabase.findOneAndUpdate({
                username: foundUser.username
            }, {

                $push: {
                    currentRoom: room
                },

                $pull: {
                    NotInRoom: room
                }

            });
            await chatDatabase.findOneAndUpdate({
                roomName: room
            }, {
                $push: {
                    roomMessage: {
                        Author: "System",
                        Comment: `${socket.username} has entered the room`
                    }
                }
            });
            let OnlineUsers = await usersDatabase.find({
                currentRoom: room
            }).select("-currentRoom -NotInRoom");
            io.to(room).except(notInRooms).emit('online list', OnlineUsers);
        }
    } catch (err) {
        console.log(err.message);
    }
};

async function storeMessage(username, message, currentRoom) {
    try {
        await chatDatabase.findOneAndUpdate({
            roomName: currentRoom
        }, {
            $push: {
                roomMessage: {
                    Author: username,
                    Comment: message
                }
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}

async function disconnect(username) {
    
    /* removing a user and socket id from the database */
    let userIndex = arrayOfUsers.findIndex(user => user.username === username);
    arrayOfUsers.splice(userIndex, 1);
    
    /* look for the user and room him the current room that he is in at the moment and place the old room inside 
    NotInRooms array. then broadcast the user has left the room */
    try {
        let findUser = await usersDatabase.findOne({
            username: username
        });
        let oldCurrentRoom = findUser.currentRoom;
        await usersDatabase.findOneAndUpdate({
            username: username
        }, {
            $pop: {
                currentRoom: 1
            },
            $push: {
                NotInRoom: findUser.currentRoom
            }
        });

        let OnlineUsers = await usersDatabase.find({
            currentRoom: oldCurrentRoom
        }).select("-currentRoom -NotInRoom");
        /* may need to be modified  */
        io.to(oldCurrentRoom).except(findUser.NotInRoom).emit('online list', OnlineUsers);
        io.to(oldCurrentRoom).except(findUser.NotInRoom).emit('user left the room', username);
        io.to(oldCurrentRoom).except(findUser.NotInRoom).emit('left private chat', username);
    } catch (err) {

    }
};







module.exports = {
    app,
    server,
    io,
    router
};
