const express = require('express');
const app = express();
const path = require("path");

const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let waitingusers = [];
let rooms = {};

io.on("connection", function (socket) {
    socket.on("joinroom", function () {
        if (waitingusers.length > 0) {
            let partner = waitingusers.shift();
            const roomname = `${socket.id}-${partner.id}`; // Fixed string interpolation

            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit("joined", roomname);
        } else {
            waitingusers.push(socket);
        }
    });

    socket.on("signalingMessage", function(data) {
        socket.broadcast.to(data.room).emit("signalingMessage", data.message);
    });

    socket.on("message", function(data) {
        socket.broadcast.to(data.room).emit("message", data.message);
    });

    socket.on('startVideoCall', function(data) {
        socket.broadcast.to(data.room).emit('incomingCall');
    });

    socket.on('rejectCall', function(data) {
        socket.broadcast.to(data.room).emit('callRejected'); // Fixed spelling
    });

    socket.on("acceptCall", function(room) {
        console.log(room);
        socket.broadcast.to(room.room).emit("callAccepted", {});
    });

    socket.on("disconnect", function() {
        let index = waitingusers.findIndex((waitingUser) => waitingUser.id === socket.id);

        if (index !== -1) {
            waitingusers.splice(index, 1);
        }
    });
});

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/chat', function(req, res) {
    res.render('chat');
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
