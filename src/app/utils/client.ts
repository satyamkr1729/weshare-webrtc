import { SocketHandlerService } from '../services/socket-handler.service';

export class Client {
  private socketId: string;
  private userName: string;
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel;
  private connected: Boolean;
  private videoCalling: Boolean;
  private audioCalling: Boolean;
  private streaming: Boolean;
  
  private pcConfig = {
    'iceServers': [{
      urls: 'stun:stun.stunprotocol.org',
    }],
  };

  constructor(private socketHandler: SocketHandlerService, socketId: string, userName: string) {
    this.socketId = socketId;
    this.userName = userName;
    this.connected = false;
    this.createPeerConnection();
    this.dataChannel = null;
    this.videoCalling = false;
    this.audioCalling = false;
    this.streaming = false;
  }

  private createPeerConnection(): void {
    try {
      this.pc = new RTCPeerConnection(this.pcConfig);
      this.pc.onicecandidate = this.handleIceCandidate.bind(this);
      this.pc.oniceconnectionstatechange = this.handleIceCandidateStateChange.bind(this);
      this.pc.onnegotiationneeded = this.handleNegotiation.bind(this);
      console.log('created Rtc peer connection');
    } catch (err) {
      console.log(err);
    }
  }

  private handleIceCandidate(ev: any): void {
    if (ev.candidate) {
      this.socketHandler.sendMessage({
          type: 'candidate',
          label: ev.candidate.sdpMLineIndex,
          id: ev.candidate.sdpMid,
          candidate: ev.candidate.candidate
        }, this.socketId);
    } else {
      console.log('End of candidates');
    }
  }

  private handleIceCandidateStateChange(ev: any): void {
    console.log(ev)
  }

  private handleNegotiation(): void {
    console.log(this.pc);
    this.pc.createOffer().then((offer) => {
      return this.pc.setLocalDescription(offer);
    }).then(() => {
      const msg = {
        type: null,
        sdp: this.pc.localDescription,
      };
      if (this.videoCalling)
        msg.type = 'video-offer';
      else if (this.audioCalling) 
        msg.type = 'audio-offer';
      else
        msg.type = 'data-offer';
      this.socketHandler.sendMessage(msg, this.socketId);
    }).catch((err) => {
      console.log(err);
    });
  }

  private createDataChannel(): void {
    this.dataChannel = this.pc.createDataChannel('mychannel');
    this.intializeDataChanneListeners();
  }

  private intializeDataChanneListeners(): void {
    this.dataChannel.onclose = this.handleDataChannelStateChange.bind(this);
    this.dataChannel.onopen = this.handleDataChannelStateChange.bind(this);
    //this.dataChannel.onmessage = this.handleMessage.bind(this);
    
  }

  private handleDataChannelStateChange(ev: any): void {
    console.log(ev);
  }

  private handleDataChannel(ev: any): void {
    this.dataChannel = ev.channel;
    this.intializeDataChanneListeners();
  }

  private createAndSendAnswer(): void {
    this.pc.createAnswer().then((answer) => {
      return this.pc.setLocalDescription(answer);
    }).then(() => {
      this.socketHandler.sendMessage({
        type: 'answer',
        sdp: this.pc.localDescription,
      }, this.socketId);
    }).catch((err) => {
      console.log(err);
    });
  }

  connect(): void {
    this.createDataChannel();
  }

  handleDataOffer(msg): void {
    const desc = new RTCSessionDescription(msg.sdp);
    if (!this.dataChannel) {
      this.pc.ondatachannel = this.handleDataChannel.bind(this);
    }
    this.pc.setRemoteDescription(desc).then(this.createAndSendAnswer.bind(this));
  }
        
  handleCallOffer(msg): void {
    const desc = new RTCSessionDescription(msg.sdp);
    this.pc.setRemoteDescription(desc).then(() => {
      return navigator.mediaDevices.getUserMedia({
        audio: Boolean(this.videoCalling || this.audioCalling),
        video: Boolean(this.videoCalling)
      });
    }).then((stream) => {
      stream.getTracks().forEach((track) => {
        this.pc.addTrack(track, stream);
      });
    }).then(this.createAndSendAnswer.bind(this));
  }

  handleSentCandidate(msg: any): void {
    const candidate: RTCIceCandidate = new RTCIceCandidate({
      sdpMLineIndex: msg.label,
      candidate: msg.candidate,
    });
    this.pc.addIceCandidate(candidate).catch((err) => console.log(candidate));
  }

  handleAnswer(msg: any): void {
    this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    this.connected = true;
  }

  getSocketId(): string {
    return this.socketId;
  }

  getUserName(): string {
    return this.userName;
  }

  isConnected(): Boolean {
    return this.connected;
  }

  sendMessage(msg): void {
    if (this.dataChannel)
      this.dataChannel.send(msg);
  }

  getDataChannel(): RTCDataChannel {
    return this.dataChannel;
  }

  getPc(): RTCPeerConnection {
    return this.pc;
  }
 
  startVideoCall(): void {
    this.videoCalling = true;
  }

  endVideoCall(): void {
    this.videoCalling = false;
  }

  startAudioCall(): void {
    this.audioCalling = true;
  }

  endAudioCall(): void {
    this.audioCalling = false;
  }
}

