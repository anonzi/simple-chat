var express = require('express');
var redis = require('socket.io-redis');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
io.adapter(redis({ host: 'localhost', port: 6379 }));
var port = 8008;
var userList = [];
var messageHistory = [];

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/static'));

app.get('/', function (req, res) {
    res.render(__dirname + '/static/index.jade');
});

io.on('connection', function (socket) {
    var addedUser = false;

    socket.emit('throw user list', {
        userList: userList
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        messageHistory.push({
            username: socket.username,
            message: data
        });
        console.log(io.sockets.sockets[socket.id]);
        console.log("######################");
        console.log("----------------------");
        console.log(socket.id);
        console.log("----------------------");
        console.log(socket);
        // console.log(socket.id);
        // tell the client to execute 'new message'
        io.sockets.sockets[socket.id].broadcast.emit('new message', {
            username: socket.username,
            message: data,
            id: socket.id
        });
        console.log(typeof(io.sockets.sockets[socket.id]));
        console.log("============================================");
        console.log(io.sockets.sockets[data]);
        // io.sockets.sockets[socket.id].emit('new message', {
        //     username: socket.username,
        //     message: data,
        //     id: socket.id
        // });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;

        // store the username in the socket session for this client
        socket.username = username;
        userList.push(username);
        addedUser = true;
        socket.emit('login', {
            userList: userList,
            messageHistory: messageHistory
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            time: Date.now(),
            username: socket.username,
            userList: userList
        });
    });

    // perform when the user disconnects
    socket.on('disconnect', function () {
        if (addedUser) {
            userList.splice(userList.indexOf(socket.username));
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                userList: userList
            });
        }
    });
});
