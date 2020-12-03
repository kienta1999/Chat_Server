
//Global variables
let currRoom = null;
let username = null
let passwordEntered = null;
let roomAdmin = null;
let allBlockedUser = [];

var socketio = io();

//After user enter their usermane and join chat
$("#new_user_btn").click(function (e) { 
    e.preventDefault();
    username = $("#username").val();
    console.log(username);
    $("#username_needed").hide();
    $("#username_not_needed").show();
    $("#hello").html(`Welcome, ${username}!`);
});

//Client send message to server
$("#send_message").click(function (e) { 
    e.preventDefault();
    if(currRoom == null){
        return;
    }
    socketio.emit('client_send_message', {message: $('#message_input').val(), room: currRoom, username: username});
    $('#message_input').val('');
});

//Client receive message to server
socketio.on('server_send_message', function(data){
    if(allBlockedUser.includes(data.username)){
        return;
    }
    document.getElementById("chatlog").appendChild(document.createElement("p"));
    document.getElementById("chatlog").appendChild(document.createTextNode(data.username + ": " + data.message));
});
//-------------------------------------------------------------------------------------------------------------------------

//Client create room with password. Infor sent to server.


//-------------------------------------------------------------------------------------------------------------------------

//CLient create room. Infor sent to server.
//first
$("#create_room").click(function (e) { 
    e.preventDefault();
    let pasword = $('#password').val();
    socketio.emit('client_create_room', {fromRoom: currRoom, toRoom: $('#room_input').val(), username: username, password: pasword});
    currRoom = $('#room_input').val();
});

//Room created. Infor sent back from server.
//third
socketio.on('server_create_room', function(data){
    const btnRoom = document.createElement("button");
    $(btnRoom).attr("id", data.room);
    $(btnRoom).html(data.room);
    $(btnRoom).attr("class", "room_name_btn");
    // document.getElementById("roomlog").appendChild(btnRoom);

    $("#roomlog").append(btnRoom);
    document.getElementById("roomlog").appendChild(document.createElement("hr"));

    $("#current_room").html(currRoom);
    if(username == data.username){
        //if the user created the room -> 
        $("#users").empty();
        roomAdmin = username;
        //this user is the one who created the room
        const liUser = document.createElement("li");
        $(liUser).html(username + " (host)");
        $("#users").append($(liUser));
        $("#chatlog").empty();
    }
//-------------------------------------------------------------------------------------------------------------------------
    //Detect user click on room btn to switch room. Info sent to server
    $($("#roomlog").find('.room_name_btn')).click(function (e) { 
        e.preventDefault();
        console.log(e.target.id);
        //Does client need password validation
        socketio.emit('client_password_validation', {fromRoom: currRoom, toRoom: e.target.id, username: username});
        //Switch Room
        let toRoom = e.target.id;
        socketio.on('server_password_validation', needValidation => {
            if(needValidation){
                $("#myForm").show();
                $("#submit-form").click(function (e) {
                    e.preventDefault();
                    passwordEntered = $("#psw").val();
                    $("#myForm").hide(); 
                    socketio.emit('client_switch_room', {fromRoom: currRoom, toRoom: toRoom, username: username, validation: true, password: passwordEntered});
                });
                //will emit client_switch_room if cancel/submit pressed - see end of file
            }
            else{
                $("#myForm").hide();
                socketio.emit('client_switch_room', {fromRoom: currRoom, toRoom: toRoom, username: username, validation: false, password: passwordEntered});
            }
        });        
    });
});

//User switch room. Infor sent back from server
socketio.on('server_switch_room', function(data){
    passwordEntered = null;
    // console.log(data.message);
    if(!data.success ){
       //|| currRoom != data.toRoom
       return;
    }
    $("#chatlog").empty();
    $("#users").empty();
   
    currRoom = data.toRoom;
    roomAdmin = data.host;
    $("#current_room").html(currRoom);
    for(var i = 0; i < data.message.length; i+=2){
        if(allBlockedUser.includes(data.message[i])){
            continue;
        }
       document.getElementById("chatlog").appendChild(document.createElement("p"));
       document.getElementById("chatlog").appendChild(document.createTextNode(data.message[i] + ": " + data.message[i + 1]));
    }
    for(var i = 0; i < data.private.length; i+=3){
        if(allBlockedUser.includes(data.private[i])){
            continue;
        }
        document.getElementById("chatlog").appendChild(document.createElement("p"));
        document.getElementById("chatlog").appendChild(document.createTextNode(data.private[i] + " (to " + data.private[i + 1] + "): "+ data.private[i + 2]));
     }

    for(var i = 0; i < data.user.length; i++){
        const liUser = document.createElement("li");
        if(i == 0){
            $(liUser).html(data.user[i] + " (host)");
            $(liUser).attr("id", data.user[i]);
            $("#users").append($(liUser));
        }
        else{
            $(liUser).html(data.user[i]);
            $(liUser).attr("id", data.user[i]);

            $("#users").append($(liUser));
            if(roomAdmin == username ){
                //You are the host && currRoom 
                const deleteUserBtn = document.createElement("button");
                $(deleteUserBtn).html("remove");
                $(deleteUserBtn).addClass("host-remove-user");
                $(deleteUserBtn).attr("id", data.user[i] + "_kick");
                
                $("#users").append($(deleteUserBtn));
            }
        }
    }
});


//-------------------------------------------------------------------------------------------------------------------------

$("#close-form").click(function (e) { 
    e.preventDefault();
    $("#myForm").hide();    
    // socketio.emit('client_switch_room', {fromRoom: currRoom, toRoom: e.target.id, username: username, validation: true, password: passwordEntered});
});

//-------------------------------------------------------------------------------------------------------------------------

//Send private message, request send to server
$("#send_private_dms").click(function (e) {
    e.preventDefault();
    const message = $("#private_dms").val();
    const receiver = $("#send_to_").val();
    socketio.emit('client_private_message', {fromUser: username, toUser: receiver, message: message, toRoom: currRoom});
});

socketio.on('server_private_message', function(data){
    if(!data.status || (data.toUser == username && allBlockedUser.includes(data.fromUser)) )
        return;
    if(currRoom == data.toRoom && (data.toUser == username || data.fromUser == username)){
        //data.message
        document.getElementById("chatlog").appendChild(document.createElement("p"));
        document.getElementById("chatlog").appendChild(document.createTextNode(data.fromUser + " (to " + data.toUser + "): "+ data.message));
        $("#private_dms").val("");
        $("#send_to_").val("");
    }
});


//-------------------------------------------------------------------------------------------------------------------------
//Block user:
$("#block_btn").click(function (e) { 
    e.preventDefault();
    const blockedUser = $("#blocked_username").val();
    $("#blocked_username").val("");
    if(blockedUser == username){
        return;
    }
    socketio.emit('client_block', {blocker: username, blocked: blockedUser});
});

socketio.on('server_block', data => {
    if(username == data.blocker){
        allBlockedUser.push(data.blocked);
    }
});