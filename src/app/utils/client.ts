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
  private localStream: MediaStream;
  
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
    this.localStream = null;
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

  private createAndSendAnswer(): Promise<any> {
    return this.pc.createAnswer().then((answer) => {
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

  handleDataOffer(msg): Promise<any> {
    const desc = new RTCSessionDescription(msg.sdp);
    if (!this.dataChannel) {
      this.pc.ondatachannel = this.handleDataChannel.bind(this);
    }
    return this.pc.setRemoteDescription(desc).then(this.createAndSendAnswer.bind(this));
  }
        
  handleCallOffer(): Promise<any> {
    console.log('handle call');
    this.addTracksToPc(); 
    return this.createAndSendAnswer();
  }

  addTracksToPc(): void {
    for (let track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    };
  }

  handleSentCandidate(msg: any): void {
    const candidate: RTCIceCandidate = new RTCIceCandidate({
      sdpMLineIndex: msg.label,
      candidate: msg.candidate,
    });
    this.pc.addIceCandidate(candidate).catch((err) => console.log(err));
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
 
  startCall(mode: string, mediaStream?: MediaStream): Promise<any> {
    console.log(mode);
    if (mode === 'video')
      this.videoCalling = true;
    else if (mode === 'audio')
      this.audioCalling = true;
    else if (mode === 'stream')
      this.streaming = true;

    if (!this.streaming) {
      return navigator.mediaDevices.getUserMedia({
        audio: <boolean>(this.audioCalling || this.videoCalling),
        video: <boolean>this.videoCalling,
      }).then((stream) => {
        this.localStream = stream;
        return stream;
      });
    }

    this.localStream = mediaStream;
    return null;
  }

  endCall(): void {
    console.log('end');
    this.audioCalling = false;
    this.videoCalling = false;
    this.streaming = false;
    if (this.localStream) {
      for(let sender of this.pc.getSenders()) {
        this.pc.removeTrack(sender);
      }
      for(let track of this.localStream.getTracks()) {
        track.stop();
      }
    }
    this.localStream = null;
  }

  isCalling(): Boolean {
    return this.videoCalling || this.audioCalling;
  }

  getCurrentCallMode(): string {
    if (this.videoCalling)
      return 'video';
    else if (this.audioCalling)
      return 'audio';
    else if (this.streaming)
      return 'stream';
    else
      return 'chat';
  }

  getLocalStream(): MediaStream {
    return this.localStream;
  }
}

