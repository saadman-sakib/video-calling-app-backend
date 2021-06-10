const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server, {
    cors: {
		origin: ['https://videochat-webrtc.netlify.app/'],
		methods: ["GET", "POST"]
	}
});

const rooms = {};

io.on("connection", socket => {
    // joining in a specific room id (if there is no room, then a room will be created)
    socket.on("join room", roomID => {
        console.log(rooms,"\n");
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
            console.log("new people arrived in the room\n");
        } else {
            rooms[roomID] = [socket.id];
            console.log("new room created\n");
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        console.log(otherUser);
        if (otherUser) {
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
            console.log("socket id sent to each other\n");
        }
    });

    // creating a offer by sending webRTC description
    socket.on("offer", payload => {
        io.to(payload.target).emit("offer", payload);
        console.log("offer sent\n");
    });

    // answering a offer by sending back other peer's webRTC description
    socket.on("answer", payload => {
        io.to(payload.target).emit("answer", payload);
        console.log("offer answered\n");
    });

    // setting up the ice candiate server after establishing the handshake
    socket.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
        console.log("ice-candidate info sent to: ", incoming.candidate, "\n");
    });
});


server.listen(8000, () => console.log('server is running on port 8000\n'));