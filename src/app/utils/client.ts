import { SocketHandlerService } from '../services/socket-handler.service';

export class Client {
  private _socketId: string;
  private _userName: string;
  private _pc: RTCPeerConnection;
  private _dataChannel: RTCDataChannel;
  private _connected: Boolean;
  private _videoCalling: Boolean;
  private _audioCalling: Boolean;
  private _streaming: Boolean;
  private _hasReceivedCall: Boolean;
  private _localStream: MediaStream;
  
  private pcConfig = {
    'iceServers': [{
      urls: 'stun:stun.stunprotocol.org',
    }],
  };

  constructor(private socketHandler: SocketHandlerService, socketId: string, userName: string) {
    this._socketId = socketId;
    this._userName = userName;
    this._connected = false;
    this.createPeerConnection();
    this._dataChannel = null;
    this._videoCalling = false;
    this._audioCalling = false;
    this._streaming = false;
    this._hasReceivedCall = false;
    this._localStream = null;
  }

  private createPeerConnection(): void {
    try {
      this._pc = new RTCPeerConnection(this.pcConfig);
      this._pc.onicecandidate = this.handleIceCandidate.bind(this);
      this._pc.oniceconnectionstatechange = this.handleIceCandidateStateChange.bind(this);
      this._pc.onnegotiationneeded = this.handleNegotiation.bind(this);
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
        }, this._socketId);
    } else {
      console.log('End of candidates');
    }
  }

  private handleIceCandidateStateChange(ev: any): void {
    console.log(ev)
  }

  private handleNegotiation(): void {
    console.log(this._pc);
    this._pc.createOffer().then((offer) => {
      return this._pc.setLocalDescription(offer);
    }).then(() => {
      const msg = {
        type: null,
        sdp: this._pc.localDescription,
      };
      if (this._videoCalling)
        msg.type = 'video-offer';
      else if (this._audioCalling) 
        msg.type = 'audio-offer';
      else
        msg.type = 'data-offer';
      this.socketHandler.sendMessage(msg, this._socketId);
    }).catch((err) => {
      console.log(err);
    });
  }

  private createDataChannel(): void {
    this._dataChannel = this._pc.createDataChannel('mychannel');
    this.intializeDataChanneListeners();
  }

  private intializeDataChanneListeners(): void {
    this._dataChannel.onclose = this.handleDataChannelStateChange.bind(this);
    this._dataChannel.onopen = this.handleDataChannelStateChange.bind(this);
    //this._dataChannel.onmessage = this.handleMessage.bind(this);
    
  }

  private handleDataChannelStateChange(ev: any): void {
    console.log(ev);
  }

  private handleDataChannel(ev: any): void {
    this._dataChannel = ev.channel;
    this.intializeDataChanneListeners();
  }

  private createAndSendAnswer(): Promise<any> {
    return this._pc.createAnswer().then((answer) => {
      return this._pc.setLocalDescription(answer);
    }).then(() => {
      this.socketHandler.sendMessage({
        type: 'answer',
        sdp: this._pc.localDescription,
      }, this._socketId);
    }).catch((err) => {
      console.log(err);
    });
  }

  connect(): void {
    this.createDataChannel();
  }

  handleDataOffer(msg): Promise<any> {
    const desc = new RTCSessionDescription(msg.sdp);
    if (!this._dataChannel) {
      this._pc.ondatachannel = this.handleDataChannel.bind(this);
    }
    return this._pc.setRemoteDescription(desc).then(this.createAndSendAnswer.bind(this));
  }
        
  handleCallOffer(): Promise<any> {
    console.log('handle call');
    this.addTracksToPc(); 
    return this.createAndSendAnswer();
  }

  addTracksToPc(): void {
    for (let track of this._localStream.getTracks()) {
      this._pc.addTrack(track, this._localStream);
    };
  }

  handleSentCandidate(msg: any): void {
    const candidate: RTCIceCandidate = new RTCIceCandidate({
      sdpMLineIndex: msg.label,
      candidate: msg.candidate,
    });
    this._pc.addIceCandidate(candidate).catch((err) => console.log(err));
  }

  handleAnswer(msg: any): void {
    this._pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    this._connected = true;
  }

  isConnected(): Boolean {
    return this._connected;
  }

  sendMessage(msg): void {
    if (this._dataChannel)
      this._dataChannel.send(msg);
  }
 
  startCall(mode: string, mediaStream?: MediaStream): Promise<any> {
    console.log(mode);
    if (mode === 'video')
      this._videoCalling = true;
    else if (mode === 'audio')
      this._audioCalling = true;
    else if (mode === 'stream')
      this._streaming = true;

    if (!this._streaming) {
      return navigator.mediaDevices.getUserMedia({
        audio: <boolean>(this._audioCalling || this._videoCalling),
        video: <boolean>this._videoCalling,
      }).then((stream) => {
        this._localStream = stream;
        return stream;
      });
    }

    this._localStream = mediaStream;
    return null;
  }

  endCall(): void {
    console.log('end');
    this._audioCalling = false;
    this._videoCalling = false;
    this._streaming = false;
    this.callRecieved = false;
    if (this._localStream) {
      for(let sender of this._pc.getSenders()) {
        this._pc.removeTrack(sender);
      }
      for(let track of this._localStream.getTracks()) {
        track.stop();
      }
    }
    this._localStream = null;
  }

  get currentCallMode(): string {
    if (this._videoCalling)
      return 'video';
    else if (this._audioCalling)
      return 'audio';
    else if (this._streaming)
      return 'stream';
    else
      return 'chat';
  }

  get callReceiveStatus(): Boolean {
    return this._hasReceivedCall;
  }

  set callRecieved(mode: Boolean) {
    this._hasReceivedCall = mode;
  } 

  get socketId(): string {
    return this._socketId;
  }

  get userName(): string {
    return this._userName;
  }

  get dataChannel(): RTCDataChannel {
    return this._dataChannel;
  }

  get pc(): RTCPeerConnection {
    return this._pc;
  }
}

