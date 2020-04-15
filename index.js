/* eslint-disable linebreak-style */
/* eslint-disable max-len */
const express = require('express');
const app = express();
const process = require('process');
// eslint-disable-next-line new-cap
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 8090;

app.use('/dashboard', express.static(__dirname + '/dashboard'));
server.listen(port);

console.log('Server listening on port ' + port);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/dashboard/index.html');
});

io.on('connection', (socket) => {
  console.log('connection incoming');

  socket.on('create or join', (room) => {
    const clientsInRoom = io.sockets.adapter.rooms[room];
    const numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    if (numClients === 0) {
      socket.join(room);
      console.log(`Client ID ${socket.id} created room ${room}`);
      socket.emit('created', room, socket.id);
    } else if (numClients >= 1) {
      console.log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    }
  });

  socket.on('message', (message) => {
    console.log(message);
    socket.broadcast.emit('message', message);
  });
});
