/* eslint-disable linebreak-style */
'use strict';

let isChannelReady = false;
let isInitiator = false;
let isStarted = false;
let localStream;
let pc;
let remoteStream;
let turnReady;

const pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302',
  }],
};

// Set up audio and video regardless of what devices are present.
const sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

const room = 'foo';

const socket = io.connect();

socket.emit('create or join', room);

socket.on('created', (room) => {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', (room) => {
  console.log('Room ' + room + ' is full');
});

socket.on('join', (room) => {
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('message', (msg) => {
  console.log('Message recieved: ' + msg);
  document.querySelector('textarea#imp').value = msg;
});

document.querySelector('textarea#imp').addEventListener('change', (ev) => {
  socket.emit('message', ev.srcElement.value);
});