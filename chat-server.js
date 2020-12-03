const http = require("http"), 
fs = require("fs"), 
url = require('url'),
path = require('path'),
mime = require('mime'),
express = require('express');

var Filter = require('bad-words'),
    filter = new Filter({ placeHolder: '*'});

var emoji = require('node-emoji')

const port = 3456;
const file = "client.html";

	//Room Object
function Room(room, message) {
  this.room = room; //"Room1"
  this.message = message; //[user, message, user, message, etc]]
}

//Global variables to save user's infor
let roomToUser = new Map(); // room -> [user(string)]
let allMessage = []; //String, [user, message, user, message, etc (string)]
//new Room("Room1", [])
let allPrivateMessage = [] //String(room), [from, to, message, from, to, message]
let roomToPassword = new Map(); //room -> password
let userToBlocked = new Map(); //blocker -> [blocked]

const app = express();
const server = http.createServer(app);

const socketio = require("socket.io");
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'static')));
//app.use(express.urlencoded());

app.get('/', (req, res) => {
  //serve client.html to / directory
    res.sendFile(path.join(__dirname, file));
  })

  
// server.listen(port);


io.on('connection', (socket) => {
    console.log('a user connected');

    //Receive message from client
    socket.on('client_send_message', (data) => {
      console.log('message: ' + data);
      let roomToInsert = allMessage.find(r => r.room == data.room);
      if(roomToInsert == null){
        allMessage.push(Room(data.room, []));
        roomToInsert = allMessage.find(r => r.room == data.room);
      }

      roomToInsert.message.push(data.username);
      roomToInsert.message.push(emoji.emojify( filter.clean(data.message) )  );
      console.log(allMessage);
      //send back infor to client
      io.in(data.room).emit('server_send_message', {message: emoji.emojify(filter.clean(data.message)), username: data.username});

      // let roomToDisplay = allMessage.find(room => room.room == currRoom);
      // socket.emit('update_room', {room: data.room, message: roomToDisplay.message});
    });

    // Receive order to create room from client
    //second
    socket.on('client_create_room', (data) => {
      // console.log('room: ' + data);
      if(data.fromRoom != null)
        socket.leave(data.fromRoom);
      socket.join(data.toRoom);
      let roomToDisplay = allMessage.find(r => r.room == data.toRoom);
      if(roomToDisplay == null){
        allMessage.push(new Room(data.toRoom, []));
        allPrivateMessage.push(new Room(data.toRoom, []));

        roomToUser.set(data.toRoom, [data.username]);
        if(data.password != null && data.password != ""){
          roomToPassword.set(data.toRoom, data.password);
          console.log("All room to password: " );
          roomToPassword.forEach((value, key, map) => {
            console.log(key + " " + value);
          });
        }
        //send back infor to client
        io.emit('server_create_room', {room: data.toRoom, username: data.username});
      }
      else{
        //room name dupliated - may do st later
      }
      // io.in(data.room).emit('update_room', {room: data.room, message: roomToDisplay.message});
      
    });

    // let waiting = false;
    socket.on('client_password_validation', (data) => {
      if(roomToPassword.has(data.toRoom)){
        io.in(socket.id).emit('server_password_validation', true);
      }
      else{
        io.in(socket.id).emit('server_password_validation', false);
      }
      // waiting = true;
    });

    // Receive order to switch room from client
    socket.on('client_switch_room', (data) => {
      // if(!waiting) return;
      // waiting = false;

      let success = true;
      if(data.validation){
        console.log("password entered: " + data.password + " vs should be " + roomToPassword.get(data.toRoom) + " at room: " + data.toRoom);
        if (data.password != roomToPassword.get(data.toRoom)){
          success = false;
        }
      }
      console.log("status: " + success);
      if(!success){
        io.in(data.fromRoom).emit('server_switch_room', {success: false});
        return;
      }
      else{
        socket.leave(data.fromRoom);
        socket.join(data.toRoom);
        let roomToDisplay = allMessage.find(r => r.room == data.toRoom);
        let privateMessageAtRoom = allPrivateMessage.find(r => r.room == data.toRoom);

        // roomToUser.set(data.room, [data.username]);
        console.log("room: " + data.toRoom + " have: " + roomToUser.get(data.toRoom));
        if(roomToUser.get(data.toRoom) == null){
          roomToUser.set(data.toRoom, []);
        }
        if(!roomToUser.get(data.toRoom).includes(data.username)){
          roomToUser.get(data.toRoom).push(data.username);
        }
        //send back infor to client
        io.in(data.toRoom).emit('server_switch_room', {toRoom: data.toRoom, message: roomToDisplay.message, user: roomToUser.get(data.toRoom), success: true, host: roomToUser.get(data.toRoom)[0], private: privateMessageAtRoom.message});
      }
      
    });


    socket.on("client_private_message", (data) => {
      if(roomToUser.get(data.toRoom) == null){
        roomToUser.set(data.toRoom, []);
      }
      if(roomToUser.get(data.toRoom).includes(data.toUser)){
        let roomToInsert = allPrivateMessage.find(r => r.room == data.toRoom);
        roomToInsert.message.push(data.fromUser); //+ "&" + data.fromUser
        roomToInsert.message.push(data.toUser);
        roomToInsert.message.push(emoji.emojify(filter.clean(data.message)));
        io.in(data.toRoom).emit('server_private_message', {toRoom: data.toRoom, fromUser: data.fromUser, toUser: data.toUser, message: emoji.emojify(filter.clean(data.message)), status: true});
      }
      else{
        io.in(data.toRoom).emit('server_private_message', {status: false});
      }
    });

    
    //userToBlocked
    socket.on("client_block", (data) => {
      if(!userToBlocked.has(data.blocker)){
        userToBlocked.set(data.blocker, []);
      }
      userToBlocked.get(data.blocker).push(data.blocked);
      console.log(data.blocker + " blocked: " + userToBlocked.get(data.blocker));
      io.emit('server_block', {blocker: data.blocker, blocked: data.blocked});
    });
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})