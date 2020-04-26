/* eslint-disable linebreak-style */
/* eslint-disable max-len */
const express = require('express');
const app = express();
const process = require('process');
// eslint-disable-next-line new-cap
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 8090;
const socketDetails = {};

app.use('/', express.static(__dirname + '/dashboard/dist/dashboard'));
server.listen(port);

console.log('Server listening on port ' + port);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/dashboard/dist/dashboard/index.html');
});

io.on('connection', (socket) => {
  console.log('connection incoming');

  socket.on('create or join', (detail) => {
    const clientsInRoom = io.sockets.adapter.rooms[detail.roomName];
    const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    if (numClients === 0) {
      socket.join(detail.roomName);
      console.log(`Client ID ${socket.id} created room ${detail.roomName}`);
      socket.emit('created', detail.roomName, socket.id);
    } else {
      console.log('Client ID ' + socket.id + ' joined room ' + detail.roomName);
      const clientList = Object.keys(clientsInRoom.sockets).map((key) => {
        return Object.assign({}, {socketId: key, userName: socketDetails[key]});
      });
      console.log(clientList);
      io.sockets.in(detail.roomName).emit('client', detail.roomName, socket.id, detail.userName);
      socket.join(detail.roomName);
      socket.emit('joined', detail.roomName, socket.id, clientList);
    }
    socketDetails[socket.id] = detail.userName;
  });

  socket.on('message', (message, socketId) => {
    console.log(message);
    socket.to(socketId).emit('message', message, socket.id);
    // socket.broadcast.emit('message', message);
  });
});
