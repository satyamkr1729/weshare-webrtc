import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketHandlerService } from '../../services/socket-handler.service';
import { Client } from 'src/app/utils/client';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})

export class RoomComponent implements OnInit {
  socketId: string;
  myName: string;
  roomName: string;
  clientList: Client[];
  selectedClient: Client;
  messages: any[];

  msgForm = new FormGroup({
    msg: new FormControl(''),
  });
  constructor(private activatedRoute: ActivatedRoute,
    private router: Router,
    private socketHandler: SocketHandlerService) { }
 
  private connectAllClients(): void {
    for(let client of this.clientList) {
      client.connect();
      client.getDataChannel().onmessage = (ev) => this.msgReceivedHandler(client.getUserName(), ev.data);
      client.getPc().ontrack = (ev) => {
        (<HTMLVideoElement>document.querySelector('div#video-container')).style.display = 'block';
        (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = ev.streams[0];
      };
    }
  }

  private initializeSocketMessageListener(): void {
    this.socketHandler.getMessage().subscribe({
      next: (obj) => {
        const client: Client = this.clientList.find((client) => client.getSocketId() === obj.socketId);
        switch(obj.message.type) {
          case 'offer':
            client.handleOffer(obj.message);
            client.getPc().ontrack = (ev) => {
              (<HTMLVideoElement>document.querySelector('div#video-container')).style.display = 'block';
              (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = ev.streams[0];
            };
            if (client.getDataChannel() === null) {
              client.getPc().addEventListener('datachannel', (ev) => {
                ev.channel.onmessage = (msgEvent) => {
                  this.msgReceivedHandler(client.getUserName(), msgEvent.data);
                }
              });
            }
            break;
          case 'candidate':
            client.handleSentCandidate(obj.message);
            break;
          case 'answer':
            client.handleAnswer(obj.message);
            break;
        }
      }
    });

    this.socketHandler.getClients().subscribe({
      next: (client) => {
        this.clientList.push(new Client(this.socketHandler, client.socketId, client.userName));
      },
    });
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe({
      next: (obj) => {
        if (!window.history.state.socketId) {
          this.router.navigate(['']);
        } else {
          this.roomName = obj.get('roomid'),
          this.socketId = window.history.state.socketId,
          this.myName = window.history.state.myName,
          this.messages = [];
          this.clientList = window.history.state.clientList.map((client) =>  new Client(this.socketHandler, client.socketId, client.userName));
          this.initializeSocketMessageListener();
          this.connectAllClients();
        }
      },
      complete: () => console.log('complete')
    });
  }

  onMsgSend(): void {
    const msg = this.msgForm.get('msg').value;
    this.messages.push({sender: this.myName, text: msg});
    this.msgForm.get('msg').setValue('');
    for(let client of this.clientList) {
      client.sendMessage(msg);
    }
  }

  msgReceivedHandler(sender: string, text: string): void {
    this.messages.push({sender, text});
    (<HTMLElement>document.querySelector('input#user-msg')).click();
    document.body.click();
    console.log(this.messages);
  }

  videoCall(client: Client): void {
    (<HTMLElement>document.querySelector('div#video-container')).style.display = 'block';
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then((stream) => {
      (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = stream;
      stream.getTracks().forEach((track) => {
        client.getPc().addTrack(track, stream);
      });
    }).catch((err) => {
      console.log(err);
    });
  }

  onCloseVideo(): void {
    (<HTMLElement>document.querySelector('div#video-container')).style.display = 'none';
  }
}
