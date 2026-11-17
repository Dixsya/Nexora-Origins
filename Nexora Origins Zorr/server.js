const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Menyajikan file game statis Anda ke web
app.use(express.static(path.join(__dirname, 'zorr_world_v5/zorr_world_fixed/Zorr')));

const players = {};

io.on('connection', (socket) => {
    console.log(`Pemain terhubung: ${socket.id}`);
    
    players[socket.id] = { id: socket.id, x: 100, y: 100, skin: 'biru' };
    
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].skin = data.skin;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Pemain keluar: ${socket.id}`);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server multiplayer aktif di port ${PORT}`);
});