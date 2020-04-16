/* eslint-disable linebreak-style */
'use strict';

const videoElement = document.querySelector('video#localVideo');
const receiverElement = document.querySelector('video#recieverVideo');
let pc;

const pcConfig = {
  'iceServers': [{
    urls: 'stun:stun.stunprotocol.org',
  }],
};

const room = 'foo';

const socket = io.connect();

socket.emit('create or join', room);

socket.on('created', (room) => {
  console.log('Created room ' + room);
});

socket.on('full', (room) => {
  console.log('Room ' + room + ' is full');
});

socket.on('join', (room) => {
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
});

socket.on('message', function(message) {
  // console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    handleOffer(message);
  } else if (message.type === 'answer') {
    pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
  } else if (message.type === 'candidate') {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate,
    });
    pc.addIceCandidate(candidate).catch((err) => console.log(candidate));
  } else if (message === 'bye') {
    handleRemoteHangup();
  }
});

/**
 * creates peer connection over rtc
 */
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleTrackAdded;
    pc.onnegotiationneeded = handleNegotiation;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

/**
 * handles ICE candidate
 * @param {Object} event
 */
function handleIceCandidate(event) {
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
    });
  } else {
    console.log('End of candidates.');
  }
}

/**
 * handles track event
 * @param {Object} ev
 */
function handleTrackAdded(ev) {
  receiverElement.srcObject = ev.streams[0];
}

/**
 * handles negotiation
 */
function handleNegotiation() {
  pc.createOffer({
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  }).then((offer) => {
    return pc.setLocalDescription(offer);
  }).then(() => {
    sendMessage({
      type: 'offer',
      sdp: pc.localDescription,
    });
  }).catch((err) => {
    console.log(err);
  });
}

/**
 * Handles removal of remote stream
 * @param {Object} event
 */
function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

/**
 * handles offer created in rtc
 * @param {Json} msg
 */
function handleOffer(msg) {
  createPeerConnection();
  const desc = new RTCSessionDescription(msg.sdp);

  pc.setRemoteDescription(desc).then(() => {
    return pc.createAnswer();
  }).then((answer) => {
    return pc.setLocalDescription(answer);
  }).then(() => {
    sendMessage({
      type: 'answer',
      sdp: pc.localDescription,
    });
  }).catch((err) => {
    console.log(err);
  });
}

/**
 * sends socket message
 * @param {Object | string} message
 */
function sendMessage(message) {
  socket.emit('message', message);
}

// handle ui
document.querySelector('button').addEventListener('click', (ev) => {
  createPeerConnection();
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  }).then((stream) => {
    videoElement.srcObject = stream;
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }).catch((err) => {
    console.log(err);
  });
});
