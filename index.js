var express = require('express');
var socket = require('socket.io');
var path    = require("path");

// App setup
var app = express();

var server = app.listen(4000, function(){
    console.log('listening for requests on port 4000,');
});

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('home', { rooms: rooms })
  })
  
app.get('/room.html',function(req,res){
    res.sendFile(path.join(__dirname+'/room.html'));
  });

// Static files
 app.use(express.static('public1'));

// pass server to socket
var io = socket(server);

const rooms = [];
// rooms = [{roomName: room1,  users: [{displayName: cindy, id: #}]}]


// listen to connections from clients
io.sockets.on('connection', function(socket) {
    socket.on('data', function(data) {
        var roomName = data.rName;
        var displayName = data.dName;
        var taken = false;
        for (var i = 0; i < rooms.length; i++) {
            if(rooms[i].room == roomName) {
                taken = true;
            }
        }
        if (taken != true) {  
            rooms.push({room: roomName, videoId: '7RS1h-FKQ0k', users: []});
        }
        socket.join(roomName);
        var welcome = {name: displayName, dColor: data.dColor};
        io.in(roomName).emit('welcome', welcome);
        for (var i = 0; i < rooms.length; i++) {
            if(rooms[i].room == roomName) {
                rooms[i].users.push({displayName: displayName, id: socket.id});
            }
        }

    });

    socket.on('requestVideoId', function(room) {
        for (var i = 0; i < rooms.length; i++) {
            if(rooms[i].room == room) {
                var data = {vid: rooms[i].videoId, mod: rooms[i].users[0].displayName};
                io.to(socket.id).emit("receiveVideoId", data);
            }
        }
    })

    socket.on('chat', function(data){
        io.in(data.rName).emit('chat', data);
    });

    socket.on('changeVid', function(data){
        for (var i = 0; i < rooms.length; i++) {
            if(rooms[i].room == data.rName){
                if(rooms[i].users[0].id == socket.id){
                    io.in(data.rName).emit('changeVideo', data.vidId);
                    rooms[i].videoId = data.vidId;
                }
                else {
                    io.to(socket.id).emit("error", data);

                }
            }
        }
    });

    socket.on("disconnect", function (){

        for (var i = 0; i < rooms.length; i++) {
            for (var n = 0; n < rooms[i].users.length; n++) {
                if(rooms[i].users[n].id == this.id) {
                    var newMod = '';
                    if(n == 0 && rooms[i].users.length == 2) {
                        newMod = rooms[i].users[1].displayName;
                    }
                    var goodbye = {name: rooms[i].users[n].displayName, newMod: newMod};
                    io.in(rooms[i].room).emit('goodbye', goodbye);
                    rooms[i].users.splice(n, 1);
                }
            }
        }

       
       for (var i = 0; i < rooms.length; i++){ 
           if (rooms[i].users.length == 0) {
               rooms.splice(i, 1);
           }
       }
    });

});


