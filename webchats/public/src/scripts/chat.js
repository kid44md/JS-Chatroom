import {
    io
} from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";


var socket = io("http://localhost:3000/", {
    reconnect: true
});
// var socket = require("socket.io-client")

console.log(window.location.href);
var room1 = document.getElementById('room1').dataset.roomName;
var room2 = document.getElementById('room2').dataset.roomName;
var room3 = document.getElementById('room3').dataset.roomName;
var room4 = document.getElementById('room4').dataset.roomName;
var home = document.getElementById('home').dataset.roomName;
var who_online_container = document.getElementById('online');
var who_online_list = document.getElementById('online-user-list');
var showUsers = document.getElementById('show-users');
var currentRoomName = window.location.href;
var singleTypingUser = document.getElementById("single-typing");
var multiTypingUsers = document.getElementById('multi-typing');
var usernameButton = document.getElementById('addUsername');
var username = document.getElementById('username');
var message = document.getElementById('message');
var addMsgButton = document.getElementById('addMsg');
var names = [];
var all_Rooms = [room1, room2, room3, room4];
var notInRooms;
var toggle = false;
//user_current_room => current room name
var user_current_room;
/* THE VARIABLES FOR THE PRIVATE ROOMS  */
/* clone the display and all of the elements inside the display for multiple private chats*/
var hidebutton = document.getElementById("hide-button");
var arrayOfPrivateUsers = [];
// var private_send_buttons;





//ADD MESSAGE HERE 
/* im making sure that the user adds a username and message
append the user message to the chat box since the user won't be able to see their own message since i made it 
to the point where the other user can see the message and not the one who sent it */
addMsgButton.addEventListener('click', sendMessage);

function sendMessage(event) {
    event.preventDefault();
    if (message.value && username.value) {
        let chatBox = document.getElementById('chatbox');
        let firstListTag = document.querySelectorAll('.chat-box li')[0];
        let newLi = document.createElement('li');
        let text = document.createTextNode(`${username.value}: ${message.value}`);
        newLi.appendChild(text);
        // Adding the user message at the top of the list 
        chatBox.insertBefore(newLi, firstListTag);
        socket.emit('chat message', message.value, username.value, notInRooms, user_current_room);
        message.value = "";
        socket.emit('stop-typing', username.value, notInRooms, user_current_room);
    } else {
        //display error 
        message.value = "";

    }
}





/* display all the users in the current room */
showUsers.addEventListener('click', showAllUsers);

/* simulate an individual(s) that is currently typing and will create one for onfocus as well */
message.addEventListener('keypress', (event) => {
    if (username.value) {
        socket.emit('user-typing', username.value, notInRooms, user_current_room);
    }
});
/* submit a message with the enter key non private message */
message.addEventListener('keydown', (event) => {
    if (event.key == 'Enter') {
        event.preventDefault();
        sendMessage(event);
    }
});



socket.on('chat message', (username, msg) => {
    let chatBox = document.getElementById('chatbox');
    let firstListTag = document.querySelectorAll('.chat-box li')[0];
    let li = document.createElement('li');
    let text = document.createTextNode(`${username}: ${msg}`);
    li.appendChild(text);
    chatBox.insertBefore(li, firstListTag);
});

socket.on('user-typing', (username) => {
    /* names array is to keep tracking of who is typing currently and places their names inside the array if not already 
    insided */
    if (!names.includes(username)) {
        names.push(username);
        if (names.length == 1) {
            singleTypingUser.innerText = `${username} is typing........`
        } else {
            singleTypingUser.innerText = "";
            multiTypingUsers.innerHTML = "";
            for (let i = 0; i < names.length; i++) {
                let li = document.createElement('li');
                let text = document.createTextNode(`${names[i]} is typing........`);
                li.appendChild(text);
                multiTypingUsers.appendChild(li);
            }
        }
    }
});

socket.on('stop-typing', (username) => {
    let findUser = names.indexOf(username);
    names.splice(findUser, 1);
    if (names.length == 0) {
        singleTypingUser.innerText = "";
        multiTypingUsers.innerHTML = "";
    } else {
        multiTypingUsers.innerHTML = "";
        for (let i = 0; i < names.length; i++) {
            let li = document.createElement('li');
            let text = document.createTextNode(`${names[i]} is typing........`);
            li.appendChild(text);
            multiTypingUsers.appendChild(li);
        }
    }

});


/* display the user username */
usernameButton.addEventListener('click', (event) => {
    if (!username.value) {
        //display error
    } else {
        let divNameContainer = document.getElementById('display-name');
        let tip = document.getElementById('tip');
        tip.style.display = "none";
        let p = document.createElement('p');
        let text = document.createTextNode(`Your current username: ${username.value}`);
        p.appendChild(text);
        divNameContainer.appendChild(p);
        event.target.disabled = true;
        event.target.hidden = true;
        username.disabled = true;
        username.hidden = true;
        for (let i = 0; i < all_Rooms.length; i++) {
            if (currentRoomName.match(all_Rooms[i])) {
                user_current_room = all_Rooms[i];
                logToRoom(all_Rooms[i], username.value, all_Rooms);
                break;
            }
        }
    }
});


function logToRoom(roomName, username, allRooms) {
    let joining = document.getElementById('Joining');
    notInRooms = allRooms.filter((room) => {
        if (room != roomName) {
            return room;
        }
    });
    socket.emit('join-room', roomName, username, notInRooms);
    /* i put the getChats function inside of a setTimeout because it is grabbing the data to early before it can even be processed 
    i realized that i need to have some type of indictor that would tell the system when to start grabbing the data. set time out it an okay indicator
     */
    /* i could add a message letting the user know that the chat message are loading */
    joining.style.visibility = "visible";
    setTimeout(() => {
        joining.style.visibility = "hidden";
        getChats(roomName);
    }, 2500);


}


async function getChats(roomName) {
    let chatMessages = await $.get(`/api/getChats/${roomName}`);
    let chatBox = document.getElementById('chatbox');
    let firstListTag = document.querySelectorAll('.chat-box li');
    console.log(firstListTag.length)

    for (let i = 0; i < chatMessages.length; i++) {
        //roomMessage is also an array so we need to loop through it 
        //0 < 1
        for (let j = 0; j < chatMessages[i].results.length; j++) {
            if (chatMessages[i].results[j].Author == "System") {
                let li = document.createElement('li');
                let text = document.createTextNode(`${chatMessages[i].results[j].Author}: ${chatMessages[i].results[j].Comment}`);
                li.style.backgroundColor = 'white';
                li.style.color = 'red';
                li.appendChild(text);
                chatBox.appendChild(li);
            } else {
                let li = document.createElement('li');
                let text = document.createTextNode(`${chatMessages[i].results[j].Author}: ${chatMessages[i].results[j].Comment}`);
                li.appendChild(text);
                chatBox.appendChild(li);
            }
        }
    }
};

socket.on('a new user has enter the room', (username) => {
    let chatBox = document.getElementById('chatbox');
    let li = document.createElement('li');
    let atag = document.createElement('a');
    atag.setAttribute('href', "#");
    atag.setAttribute('data-username', `${username}`);
    let atagText = document.createTextNode(`${username}`);
    atag.appendChild(atagText);
    li.append(atag);
    let text = document.createTextNode(`: has entered the room!!!`);
    li.style.backgroundColor = 'lightblue';
    li.appendChild(text);
    chatBox.appendChild(li);
});

/* if a user enters a room will check if his name is in the namelist if it is not inside the list, add it to the list and display the list */

/* display the list of users inside the room and creating a private button next to the other individuals 
name except for the user themselves we don't want the user to send private messages to themselves*/
socket.on('online list', (listOfUsers) => {
    who_online_list.innerHTML = "";
    for (let i = 0; i < listOfUsers.length; i++) {
        if (listOfUsers[i].username == username.value) {
            let ptag = document.createElement('p');
            let text = document.createTextNode(`${listOfUsers[i].username}`);
            ptag.appendChild(text);
            who_online_list.appendChild(ptag);
        } else {
            let ptag = document.createElement('p');
            let text = document.createTextNode(`${listOfUsers[i].username}`);
            ptag.appendChild(text);
            let button = document.createElement('button');
            text = document.createTextNode(`Send a private message to ${listOfUsers[i].username}`);
            button.appendChild(text);
            button.setAttribute('data-username', `${listOfUsers[i].username}`);
            button.setAttribute('class', `private-msg-button`);
            who_online_list.appendChild(ptag);
            who_online_list.appendChild(button);
        }

    }
    let privateButton = document.querySelectorAll('.private-msg-button');
    /*  send a private message button, allowing the user to send a private message to that individual   */
    console.log(privateButton);
    privateButton.forEach((button) => {
        button.addEventListener('click', (event) => {
            console.log(button);
            setupPrivateMessage(event, event);
        });
    });
});



socket.on('user left the room', (username) => {
    let chatBox = document.getElementById('chatbox');
    let li = document.createElement('li');
    let text = document.createTextNode(`${username}: has left the chatroom!!!`);
    li.style.backgroundColor = 'lightblue';
    li.appendChild(text);
    chatBox.insertBefore(li, chatBox.firstElementChild);
});


function showAllUsers(event) {
    if (!toggle) {
        toggle = true
        who_online_container.style.display = "block";
    } else {
        toggle = false;
        who_online_container.style.display = "none";
    }
};


/* target.dataset.username => the other username that you want to talk to
this is only doing the initial setup, no message being send just yet.
*/
function setupPrivateMessage(event) {
    socket.emit('private connection', username.value, event.target.dataset.username);
    buildPrivateMsgDisplay(event.target.dataset.username);
}

/* create the private chat display by using the template which doesn't render the html automatically,  only through javascript where we can use the template
I am using the template and just cloning it and making small modification to it.
if the user is not the array of private user which is essentially keeping track of who you are talking privately
if they are new it will create the custom template if not it won't do anything*/
function buildPrivateMsgDisplay(privateUsername) {
    // Close Private chat with Macy
    if (!arrayOfPrivateUsers.includes(privateUsername)) {
        arrayOfPrivateUsers.push(privateUsername);
        let privateChatContainer = document.getElementsByClassName('private-chat-container')[0];
        let temp = document.getElementsByTagName("template")[0]
        let clone = temp.content.cloneNode(true);
        let private_chat_display = clone.querySelector('.private-chat-details');
        private_chat_display.style.visibility = "visible";
        let div = clone.querySelector('.private-name-button');
        let closeButton = clone.querySelector('.close-private-chat');
        closeButton.setAttribute('data-close-user', `${privateUsername}`);
        closeButton.innerText = `Close Private Chat with ${privateUsername}`;
        let notifyDisplay = clone.querySelector('.notify');
        notifyDisplay.innerText = `New Message from ${privateUsername} !`;
        let hideDisplay = clone.querySelector('.hide-display');
        hideDisplay.setAttribute('data-hide-username', `${privateUsername}`);
        hideDisplay.innerText = `Hide Messages from ${privateUsername}`;
        let submitButton = clone.querySelector('.private-sendMsg');
        submitButton.setAttribute('data-private-username', `${privateUsername}`);
        let hTitle = document.createElement('h4');
        let text = document.createTextNode(`You're talking to ${privateUsername}`);
        hTitle.appendChild(text);
        div.insertBefore(hTitle, hideDisplay);
        privateChatContainer.appendChild(clone);
    }
    /* letting the other user know that the other person is typing if the display is open or not
    once the message is sent the notification will show up */
    document.querySelectorAll('.private-message-input').forEach((html) => {
        html.addEventListener('keypress', privateMsgTyping)
    });

    /* letting the user being able to pressed enter instead of clicking the submit button */

    document.querySelectorAll('.private-message-input').forEach((html) => {
        html.addEventListener('keydown', (event) => {
            if (event.key == 'Enter') {
                event.preventDefault();
                submitEnterPrivateMessage(event);
            }
        });
    });

    /* adding functionality to the button that will show and hide their private chats  */
    document.querySelectorAll('.hide-display').forEach((html) => {
        html.addEventListener('click', hideShowDisplay)
    });
    /* button to close the private chats with individuals  */
    document.querySelectorAll('.close-private-chat').forEach((html) => {
        html.addEventListener('click', closeChat);
    });

    /* allow the user to send the message to the other person  */
    let private_send_buttons = document.querySelectorAll('.private-sendMsg');
    private_send_buttons.forEach((html) => {
        html.addEventListener('click', submitPrivateMessage);
    })
}

socket.on('connecting to other user', (senderUsername) => {
    /* set the chat box of the recipient to not be visible but will display the notification once they have
    received a message 
    we had to build that functionality with a second div container already created with in the template*/
    if (!arrayOfPrivateUsers.includes(senderUsername)) {
        arrayOfPrivateUsers.push(senderUsername);
        let privateChatContainer = document.getElementsByClassName('private-chat-container')[0];
        let temp = document.getElementsByTagName("template")[0]
        let clone = temp.content.cloneNode(true);
        let private_chat_display = clone.querySelector('.private-chat-details');
        private_chat_display.style.visibility = "hidden";
        let div = clone.querySelector('.private-name-button');
        let closeButton = clone.querySelector('.close-private-chat');
        closeButton.setAttribute('data-close-user', `${senderUsername}`);
        closeButton.innerText = `Close Private Chat with ${senderUsername}`;
        let notifyDisplay = clone.querySelector('.notify');
        notifyDisplay.innerText = `New Message from ${senderUsername}!`;
        let hideDisplay = clone.querySelector('.hide-display');
        hideDisplay.setAttribute('data-hide-username', `${senderUsername}`)
        hideDisplay.innerText = `Hide Messages from ${senderUsername}`;
        let submitButton = clone.querySelector('.private-sendMsg');
        submitButton.setAttribute('data-private-username', `${senderUsername}`);
        let hTitle = document.createElement('h4');
        let text = document.createTextNode(`You're talking to ${senderUsername}`);
        hTitle.appendChild(text);
        let button = document.createElement('button');
        text = document.createTextNode(`Hide messages from ${senderUsername}`);
        button.appendChild(text);
        div.insertBefore(hTitle, hideDisplay);
        privateChatContainer.appendChild(clone);
    }


    /* letting the other user know that the other person is typing if the display is open or not
    once the message is sent the notification will show up */
    document.querySelectorAll('.private-message-input').forEach((html) => {
        html.addEventListener('keypress', privateMsgTyping)
    });




    /* adding functionality to the button that will show and hide their private chats  */
    document.querySelectorAll('.hide-display').forEach((html) => {
        html.addEventListener('click', hideShowDisplay)
    });

    /* letting the user being able to pressed enter instead of clicking the submit button */

    document.querySelectorAll('.private-message-input').forEach((html) => {
        html.addEventListener('keydown', (event) => {
            if (event.key == 'Enter') {
                event.preventDefault();
                submitEnterPrivateMessage(event);
            }
        });
    });

    /* button to close the private chats with individuals  */
    document.querySelectorAll('.close-private-chat').forEach((html) => {
        html.addEventListener('click', closeChat);
    });


    let private_send_buttons = document.querySelectorAll('.private-sendMsg');
    private_send_buttons.forEach((html) => {
        html.addEventListener('click', submitPrivateMessage);
    })
});


/* send a message to the other user privately  */
function submitPrivateMessage(event) {
    //srcElement.nextElementSibling.dataset.privateUsername from the keydown event since the keydown event doesn't have a dataset
    //target.dataset.privateUsername = > blake from the button
    //srcElement.form[0].value => Message
    let recipient = event.target.dataset.privateUsername;
    let index = arrayOfPrivateUsers.findIndex((user) => {
        return user == recipient;
    });
    let private_chat_Box = document.getElementsByClassName('private-chat-box')[index];
    if (event.srcElement.form[0].value) {
        let li = document.createElement('li');
        let text = document.createTextNode(`${username.value}: ${event.srcElement.form[0].value}`);
        li.appendChild(text);
        private_chat_Box.insertBefore(li, private_chat_Box.firstElementChild);
        socket.emit("sending private message", username.value, event.srcElement.form[0].value, event.target.dataset.privateUsername);
        socket.emit('private user stop typing', username.value, event.target.dataset.privateUsername);
        event.srcElement.form[0].value = "";
    }
};


/* send a message to the other user privately  */
function submitEnterPrivateMessage(event) {
    //srcElement.nextElementSibling.dataset.privateUsername from the keydown event since the keydown event doesn't have a dataset
    //target.value => Message
    //srcElement.form[0].value => Message
    let recipient = event.srcElement.nextElementSibling.dataset.privateUsername;
    let index = arrayOfPrivateUsers.findIndex((user) => {
        return user == recipient;
    });
    let private_chat_Box = document.getElementsByClassName('private-chat-box')[index];
    if (event.srcElement.form[0].value) {
        let li = document.createElement('li');
        let text = document.createTextNode(`${username.value}: ${event.srcElement.form[0].value}`);
        li.appendChild(text);
        private_chat_Box.insertBefore(li, private_chat_Box.firstElementChild);
        socket.emit("sending private message", username.value, event.target.value, recipient);
        socket.emit('private user stop typing', username.value, recipient);
        event.srcElement.form[0].value = "";
    }
};





/* if statement will help me determine if the person has their messages open to that particular user or not 
if the user hasn't then a notification will be display
if the user has the message open the notification will not be displayed  */
socket.on('New Message', (sender, message) => {
    /* the index is a reflection of what notification container that i need to target
    everyone in the array of private users are added at the same time their display are created */
    let index = arrayOfPrivateUsers.findIndex((users) => {
        return users == sender
    });
    let notificationContainer = document.getElementsByClassName('notification-container')[index];
    let display = document.getElementsByClassName('private-chat-details')[index];
    /* if the display is hidden show the notification button, if the display is visible then don't show the notification button  */
    if (display.style.visibility == "hidden" || display.style.visibility == "") {

        /* if the notification is hidden we want to make it visible to show that the user has a new message
        behind the scene we will add the text to the box */
        if (notificationContainer.style.visibility == "hidden" || notificationContainer.style.visibility == "") {
            notificationContainer.style.visibility = "visible";
            /* check to see if there is a message or not 
            if there is a message we want the recent message above the previous message  */
            let private_chat_Box = document.getElementsByClassName('private-chat-box')[index];
            if (private_chat_Box.firstElementChild != null) {
                let li = document.createElement('li');
                let text = document.createTextNode(`${sender}: ${message}`);
                li.appendChild(text);
                private_chat_Box.insertBefore(li, private_chat_Box.firstElementChild);
            } else {
                let li = document.createElement('li');
                let text = document.createTextNode(`${sender}: ${message}`);
                li.appendChild(text);
                private_chat_Box.appendChild(li);
            }
        }

    } else {
        /* check to see if there is a message or not 
               if there is a message we want the recent message above the previous message  */
        let private_chat_Box = document.getElementsByClassName('private-chat-box')[index];
        if (private_chat_Box.firstElementChild != null) {
            let li = document.createElement('li');
            let text = document.createTextNode(`${sender}: ${message}`);
            li.appendChild(text);
            private_chat_Box.insertBefore(li, private_chat_Box.firstElementChild);
        } else {
            let li = document.createElement('li');
            let text = document.createTextNode(`${sender}: ${message}`);
            li.appendChild(text);
            private_chat_Box.appendChild(li);
        }
    }



    let notify_button = document.querySelectorAll('.notify');
    notify_button.forEach((html) => {
        html.addEventListener('click', (event) => {
            notifyMessage(event, index);
        });
    })
});

function notifyMessage(event, index) {
    //srcElement.parentElement.previousElementSibling.childNodes[2].dataset.hideUsername => grabbing 
    let name = event.srcElement.parentElement.previousElementSibling.childNodes[2].dataset.hideUsername;
    let notificationContainer = document.getElementsByClassName('notification-container')[index];
    let display = document.getElementsByClassName('private-chat-details')[index];
    let hideDisplay = document.getElementsByClassName('private-name-button')[index];
    if (notificationContainer.style.visibility == "visible") {
        notificationContainer.style.visibility = "hidden";
        display.style.visibility = "visible";
        if (hideDisplay.style.visibility == "visible") {
            event.srcElement.parentElement.previousElementSibling.childNodes[2].innerText = `Hide Messages from ${name}`;
        }
    }
}



function privateMsgTyping(event) {
    // target.nextElementSibling.dataset => the other user that you are talking to
    if (username.value) {
        socket.emit('private user is typing', username.value, event.target.nextElementSibling.dataset);
    }
}

socket.on('private user is typing', (sender) => {
    let index = arrayOfPrivateUsers.findIndex((users) => {
        return users == sender
    });
    let userTyping = document.getElementsByClassName('private-single-typing')[index];
    userTyping.innerText = `${sender} is typing`;
});

socket.on('private user stop typing', (sender) => {
    let index = arrayOfPrivateUsers.findIndex((users) => {
        return users == sender
    });
    let userTyping = document.getElementsByClassName('private-single-typing')[index];
    userTyping.innerText = "";
});

function hideShowDisplay(event) {
    //target.textContent => 'hide message from the user'
    //target.dataset.hideUsername
    /* the person who i am talking to is inside the dataset  */

    let index = arrayOfPrivateUsers.findIndex((users) => {
        return users == event.target.dataset.hideUsername;
    });
    let display = document.getElementsByClassName('private-chat-details')[index];

    let hideDisplay = document.getElementsByClassName('private-name-button')[index];
    /*remember that the button is originally showing "hide messages" 
     */
    let notificationContainer = document.getElementsByClassName('notification-container')[index];
    if (display.style.visibility == "visible") {
        display.style.visibility = "hidden";
        hideDisplay.style.visibility = "visible";
        event.target.textContent = `Show Messages from ${event.target.dataset.hideUsername}!`;
    } else {
        display.style.visibility = "visible";
        hideDisplay.style.visibility = "visible";
        event.target.textContent = `Hide Messages from ${event.target.dataset.hideUsername}!`;
        /* checking to see if the notification is visible along side the show message text */
        if (notificationContainer.style.visibility == "visible") {
            notificationContainer.style.visibility = "hidden";
        }
    }

}

socket.on('left private chat', (username) => {
    let index = arrayOfPrivateUsers.findIndex((users) => {
        return users == username;
    });
    let private_chat_Box = document.getElementsByClassName('private-chat-box')[index];
    let li = document.createElement('li');
    let text = document.createTextNode(`${username}: left the private chat`);
    li.appendChild(text);
    let systemLi = document.createElement('li');
    text = document.createTextNode(`System: You can no longer send messages, please close the chat. Then resend that user a message again`);
    systemLi.appendChild(text);
    let messageButton = document.getElementsByClassName('private-message-input')[index];
    messageButton.disabled = true;
    private_chat_Box.insertBefore(li, private_chat_Box.firstElementChild);
    private_chat_Box.insertBefore(systemLi, private_chat_Box.firstElementChild);
});

function closeChat(event) {
    let recipient = event.target.previousElementSibling[1].dataset.privateUsername;
    //target.previousElementSibling[1].dataset
    if (arrayOfPrivateUsers.includes(recipient)) {
        let index = arrayOfPrivateUsers.findIndex((users) => {
            return users == recipient;
        });
        arrayOfPrivateUsers.splice(index, 1);
        let display = document.getElementsByClassName('private-chat-details')[index];
        display.remove();
        socket.emit('user close private chat', username.value, recipient);
    }
};