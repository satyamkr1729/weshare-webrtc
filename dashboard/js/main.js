/* eslint-disable linebreak-style */
const socket = io.connect();

socket.emit('message', {msg: 'hello from other end'});
