import { SocketHandlerService } from '../services/socket-handler.service';

export class Client {
  private socketId: string;
  private userName: string;
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel;
  private connected: Boolean;
  private msgPrinter: (sender: string, text: string) => void;

  private pcConfig = {
    'iceServers': [{
      urls: 'stun:stun.stunprotocol.org',
    }],
  };

  constructor(private socketHandler: SocketHandlerService, socketId: string, userName: string, msgPrinter: (sender: string, text: string) => void) {
    this.socketId = socketId;
    this.userName = userName;
    this.connected = false;
    this.pc = null;
    this.dataChannel = null;
    this.msgPrinter = msgPrinter;
  }

  private createPeerConnection(): void {
    try {
      this.pc = new RTCPeerConnection(this.pcConfig);
      this.pc.onicecandidate = this.handleIceCandidate.bind(this);
      this.pc.ontrack = this.handleTrackAdded.bind(this);
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

  private handleTrackAdded(): void {

  }

  private handleNegotiation(): void {
    console.log(this.pc);
    this.pc.createOffer().then((offer) => {
      return this.pc.setLocalDescription(offer);
    }).then(() => {
      this.socketHandler.sendMessage({
        type: 'offer',
        sdp: this.pc.localDescription,
      }, this.socketId);
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
    this.dataChannel.onmessage = this.handleMessage.bind(this);
  }

  private handleDataChannelStateChange(ev: any): void {
    console.log(ev);
  }

  private handleMessage(ev: any): void {
    this.msgPrinter(this.userName, ev.data);
  }

  private handleDataChannel(ev: any): void {
    this.dataChannel = ev.channel;
    this.intializeDataChanneListeners();
  }

  connect(): void {
    this.createPeerConnection();
    this.createDataChannel();
  }

  handleOffer(msg): void {
    this.createPeerConnection();
    if (!this.connected) {
      this.pc.ondatachannel = this.handleDataChannel.bind(this);
    }
    const desc = new RTCSessionDescription(msg.sdp);
    this.pc.setRemoteDescription(desc).then(() => {
      return this.pc.createAnswer();
    }).then((answer) => {
      return this.pc.setLocalDescription(answer);
    }).then(() => {
      this.connected = true;
      this.socketHandler.sendMessage({
        type: 'answer',
        sdp: this.pc.localDescription,
      }, this.socketId);
    }).catch((err) => {
      console.log(err);
    });
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
}

