/* eslint-disable linebreak-style */
/* eslint-disable max-len */

/* This file contains code for signalling server to be used with WebRTC app */

const express = require('express');
const app = express();
const process = require('process');
const path = require('path');
// eslint-disable-next-line new-cap
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 8090;
const socketDetails = {};

app.use('/', express.static(path.join(__dirname, '../dist/dashboard')));
server.listen(port);

console.log('Server listening on port ' + port);

app.get('/', (req, res) => {
  console.log(__dirname);
  res.sendFile(path.join(__dirname, '../dist/dashboard/index.html'));
});

io.on('connection', (socket) => {
  console.log('connection incoming');

  socket.on('create', (detail) => {
    const clientsInRoom = io.sockets.adapter.rooms[detail.roomName];
    const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

    if (numClients === 0) {
      socket.join(detail.roomName);
      console.log(`Client ID ${socket.id} created room ${detail.roomName}`);
      socket.emit('created', {success: true, socketId: socket.id, clientList: []});
      socketDetails[socket.id] = detail.userName;
    } else {
      socket.emit('created', {success: false});
    }
  });

  socket.on('join', (detail) => {
    const clientsInRoom = io.sockets.adapter.rooms[detail.roomName];
    const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

    if (numClients !== 0) {
      console.log('Client ID ' + socket.id + ' joined room ' + detail.roomName);
      const clientList = Object.keys(clientsInRoom.sockets).map((key) => {
        return Object.assign({}, {socketId: key, userName: socketDetails[key]});
      });
      console.log(clientList);
      io.sockets.in(detail.roomName).emit('client', {socketId: socket.id, userName: detail.userName});
      socket.join(detail.roomName);
      socket.emit('joined', {success: true, socketId: socket.id, clientList});
      socketDetails[socket.id] = detail.userName;
    } else {
      socket.emit('joined', {success: false});
    }
  });

  socket.on('message', (message, socketId) => {
    console.log(message);
    socket.to(socketId).emit('message', {message, socketId: socket.id});
    // socket.broadcast.emit('message', message);
  });
});
