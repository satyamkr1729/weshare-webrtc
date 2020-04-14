/* eslint-disable linebreak-style */
const express = require('express');
const app = express();
// eslint-disable-next-line new-cap
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = 8090;

app.use('/dashboard', express.static(__dirname + '/dashboard'));
server.listen(port);

console.log('Server listening on port ' + port);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/dashboard/index.html');
});

io.on('connection', (socket) => {
  console.log('connection incoming');
  socket.on('message', (message) => {
    console.log(message);
  });
});
