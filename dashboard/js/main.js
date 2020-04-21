/* eslint-disable linebreak-style */
/* eslint-disable max-len */
'use strict';

let userName;
let clientList = [];
let socket;

/**
 * creates socket connection
 * @param {string} userName
 * @param {string} roomName
 */
function createSocketConnection(userName, roomName) {
  socket = io.connect();

  socket.emit('create or join', {roomName, userName});

  socket.on('created', (room, id) => {
    console.log('Created room: ' + room + ' My id: ' + id);
    alert(`Joined ${room} successfully`);
  });

  socket.on('client', (room, socketId, userName) => {
    const client = new Client(socketId, userName, sendMessage);
    clientList.push(client);
    addClient(client);
    console.log(`Client ${userName} with id ${socketId} joined room ` + room);
  });

  socket.on('joined', function(room, socketId, presentClientList) {
    clientList = presentClientList.map((val) => new Client(val.socketId, val.userName, sendMessage));
    clientList.forEach((client) => addClient(client));
    console.log('joined: ' + room + ' My id: ' + socketId);
    alert(`Joined ${room} successfully`);
  });

  socket.on('message', function(message, socketId) {
    // console.log('Client received message:', message);
    const client = clientList.find((val) => val.socketId === socketId);
    if (message.type === 'data-offer') {
      document.querySelector('div#chat-box').setAttribute('data-id', socketId);
      client.handleDataOffer(message);
    } else if (message.type === 'answer') {
      document.querySelector('div#chat-box').setAttribute('data-id', socketId);
      client.handleAnswer(message);
    } else if (message.type === 'candidate') {
      client.handleCandidate(message);
    }
  });
}

/**
 * adds client to ui
 * @param {Client} client
 */
function addClient(client) {
  const node = document.querySelector('div#client-list ul');
  const html = `
    <li class="client" data-id=${client.socketId}>${client.name}</li>
  `;
  node.insertAdjacentHTML('beforeend', html);

  node.lastElementChild.addEventListener('click', (ev) => {
    const client = clientList.find((val) => val.socketId === ev.srcElement.getAttribute('data-id'));
    client.connect();
  });
}

/**
 * sends socket message
 * @param {Object | string} message
 * @param {string} socketId
 */
function sendMessage(message, socketId) {
  socket.emit('message', message, socketId);
}

document.forms['chat-message'].addEventListener('submit', (ev) => {
  ev.preventDefault();
  const msg = document.querySelector('input#message').value;
  const client = clientList.find((val) => val.socketId === ev.srcElement.parentElement.getAttribute('data-id'));

  client.dataChannel.send(msg);
  document.querySelector('div#messages').dispatchEvent(new CustomEvent('update', {detail: {msg, sender: userName}}));

  const messages = JSON.parse(sessionStorage.getItem(client.socketId)) || [];
  messages.push({sender: userName, text: msg});
  sessionStorage.setItem(client.socketId, JSON.stringify(messages));
});

document.forms['connect-form'].addEventListener('submit', (ev) => {
  ev.preventDefault();
  userName = document.forms['connect-form']['your-name'].value.trim();
  const roomName = document.forms['connect-form']['room-name'].value.toLowerCase().trim();
  createSocketConnection(userName, roomName);
});

document.querySelector('div#messages').addEventListener('update', (ev) => {
  const html = `
    <li>
      <span class="sender"><u>${ev.detail.sender}:</u></span><br>
      <span class="message-body">${ev.detail.msg}</span>
    </li>
  `;
  document.querySelector('div#messages ul').insertAdjacentHTML('beforeend', html);
});
