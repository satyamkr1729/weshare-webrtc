/* eslint-disable linebreak-style */
/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
'use strict';

const pcConfig = {
  'iceServers': [{
    urls: 'stun:stun.stunprotocol.org',
  }],
};

/**
 * Client Object
 * @param {string} id
 * @param {string} name
 * @param {Function} messageSender
 */
function Client(id, name, messageSender) {
  this.socketId = id;
  this.name = name;
  this.pc = null;
  this.dataChannel = null;
  this.messageSender = messageSender;
}

Client.prototype.connect = function() {
  createPeerDataConnection.call(this);
};

Client.prototype.handleDataOffer = function(msg) {
  createPeerConnection.call(this);
  const desc = new RTCSessionDescription(msg.sdp);
  this.pc.ondatachannel = handleDataChannel.bind(this);
  this.pc.setRemoteDescription(desc).then(() => {
    return this.pc.createAnswer();
  }).then((answer) => {
    return this.pc.setLocalDescription(answer);
  }).then(() => {
    this.messageSender({
      type: 'answer',
      sdp: this.pc.localDescription,
    }, this.socketId);
  }).catch((err) => {
    console.log(err);
  });
};

Client.prototype.handleAnswer = function(msg) {
  alert('Connection Complete!!');
  this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
};

Client.prototype.handleCandidate = function(msg) {
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: msg.label,
    candidate: msg.candidate,
  });
  this.pc.addIceCandidate(candidate).catch((err) => console.log(candidate));
};

/**
 * creates peer Data connection
 */
function createPeerDataConnection() {
  try {
    this.pc = new RTCPeerConnection(pcConfig);
    this.pc.onicecandidate = handleIceCandidate.bind(this);
    this.dataChannel = this.pc.createDataChannel('myChannel');
    this.dataChannel.onclose = handleDataChannelStateChange.bind(this);
    this.dataChannel.onopen = handleDataChannelStateChange.bind(this);
    this.dataChannel.onmessage = handleMessage.bind(this);
    this.pc.onnegotiationneeded = handleDataNegotiation.bind(this);
    console.log('create RTCPeerCOnnection!!');
  } catch (e) {
    console.log(e);
  }
};

/**
 * creates peer connection only. adds no listener for track or data
 */
function createPeerConnection() {
  try {
    this.pc = new RTCPeerConnection(pcConfig);
    this.pc.onicecandidate = handleIceCandidate.bind(this);
    this.pc.onnegotiationneeded = handleDataNegotiation.bind(this);
    console.log('create RTCPeerCOnnection!!');
  } catch (e) {
    console.log(e);
  }
}

/**
 * handles ice candidate
 * @param {Object} event
 */
function handleIceCandidate(event) {
  if (event.candidate) {
    this.messageSender({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
    }, this.socketId);
  } else {
    console.log('End of candidates.');
  }
}

/**
 * handle state change
 * @param {Object} e
 */
function handleDataChannelStateChange(e) {
  console.log('State changed: ' + e);
}

/**
 * handles message
 * @param {Object} ev
 */
function handleMessage(ev) {
  console.log(ev.data);
  const messages = JSON.parse(sessionStorage.getItem(this.socketId)) || [];
  messages.push({sender: this.name, text: ev.data});
  sessionStorage.setItem(this.socketId, JSON.stringify(messages));
  document.querySelector('div#messages').dispatchEvent(new CustomEvent('update', {detail: {msg: ev.data, sender: this.name}}));
}

/**
 * negotiation in case of data channel
 */
function handleDataNegotiation() {
  this.pc.createOffer().then((offer) => {
    return this.pc.setLocalDescription(offer);
  }).then(() => {
    this.messageSender({
      type: 'data-offer',
      sdp: this.pc.localDescription,
    }, this.socketId);
  }).catch((err) => {
    console.log(err);
  });
}

/**
 * handles datachannel event on callee side
 * @param {Object} ev
 */
function handleDataChannel(ev) {
  console.log('Data Channel recieved: ' + ev);
  this.dataChannel = ev.channel;
  this.dataChannel.onopen = handleDataChannelStateChange.bind(this);
  this.dataChannel.onclose = handleDataChannelStateChange.bind(this);
  this.dataChannel.onmessage = handleMessage.bind(this);
}

window.Client = Client;
