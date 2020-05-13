import { Component, OnInit, ɵpatchComponentDefWithScope, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketHandlerService } from '../../services/socket-handler.service';
import { Client } from 'src/app/utils/client';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { fromEvent } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CallModeSelectorComponent } from './call-mode-selector/call-mode-selector.component';
import { CallAnswerComponent } from './call-answer/call-answer.component';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  messages: any[];
  activeCalledClient: Client;
  matDialogRef: MatDialogRef<any>;

  msgForm = new FormGroup({
    msg: new FormControl(''),
  });

  constructor(public activatedRoute: ActivatedRoute,
    private router: Router,
    private socketHandler: SocketHandlerService,
    private dialog: MatDialog,
    private notifier: MatSnackBar,
    private ngZone: NgZone) { }
 
  private connectAllClients(): void {
    for(let client of this.clientList) {
      client.connect();
      client.getDataChannel().onmessage = (ev) => this.msgReceivedHandler(client, ev.data);
      client.getPc().ontrack = (ev) => {
        //(<HTMLVideoElement>document.querySelector('div#video-container')).style.display = 'block';
        (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = ev.streams[0];
      };
    }
  }

  private initializeSocketMessageListener(): void {
    this.socketHandler.getMessage().subscribe({
      next: (obj) => {
        const client: Client = this.clientList.find((client) => client.getSocketId() === obj.socketId);
        switch(obj.message.type) {
          case 'data-offer':
            client.handleDataOffer(obj.message).catch((err) => {
              console.log(err);
              this.ngZone.run(() => {
                this.notifier.open(`Connection to ${client.getUserName()} failed`, 'OK');
              });
            });
            break;

          case 'audio-offer':
          case 'video-offer':
            client.getPc().setRemoteDescription(new RTCSessionDescription(obj.message.sdp)).then(() => {
              return client.startCall(obj.message.type.split('-')[0]);
            }).catch((err) => {
              console.log(err);
              this.handleGetUserMediaErrors(err, client);
            }).then(() => {
              return client.handleCallOffer();
            }).then(() => {
              this.activeCalledClient = client;
            }).catch((err) => {
              console.log(err);
              this.notifier.open('Error establishing Connection', 'OK')
            });
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
        client = new Client(this.socketHandler, client.socketId, client.userName);
        this.clientList.push(client);
        client.getPc().ontrack = (ev) => {
          //(<HTMLVideoElement>document.querySelector('div#video-container')).style.display = 'block';
          (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = ev.streams[0];
        };
        client.getPc().addEventListener('datachannel', (ev) => {
          ev.channel.onmessage = (msgEvent) => {
            this.msgReceivedHandler(client, msgEvent.data);
          }
        });
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
      client.sendMessage(JSON.stringify({type: 'text', body: msg}));
    }
  }

  msgReceivedHandler(client: Client, msg: any): void {
    msg = JSON.parse(msg);
    switch(msg.type) {
      case 'text': 
        this.ngZone.run(() => {
          this.messages.push({sender: client.getUserName(), text: msg.body});
        });
        // (<HTMLElement>document.querySelector('input#user-msg')).click();
        // document.body.click();
        break;
      
      case 'call': 
        // (<HTMLElement>document.querySelector('input#user-msg')).click();
        // document.body.click();
        this.ngZone.run(() => {
          if (this.matDialogRef)
            this.matDialogRef.close();
          this.matDialogRef = this.dialog.open(CallAnswerComponent, {
            data: {mode: msg.mode, caller: client.getUserName()},
            width: '250px',
            hasBackdrop: true,
          });
          this.matDialogRef.afterClosed().subscribe((result) => {
            this.matDialogRef = null;
            if (result === 'accept') {
              this.activeCalledClient = client;
              client.sendMessage(JSON.stringify({type: 'call-accepted'}));
            } else if (result === 'reject') {
              client.sendMessage(JSON.stringify({type: 'call-rejected'}));
            }
          });
        });
        break;
      
      case 'call-accepted': 
        client.addTracksToPc();
        break;
      
      case 'call-rejected':
        this.ngZone.run(() => {
          this.activeCalledClient = null;
          (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = null;
          client.endCall(); 
          //(<HTMLElement>document.querySelector('div#video-container')).style.display = 'none';
          this.notifier.open('Call Rejected!!', 'OK', {
            duration: 3000,
          });
        });
        break; 

      case 'call-end':
        this.ngZone.run(() => {
          if (this.matDialogRef)
            this.matDialogRef.close();
          this.endCurrentCall();
        });
        break;
    }
  }

  handleCallAction(client: Client): void {
    this.matDialogRef = this.dialog.open(CallModeSelectorComponent, {
      width: '250px',
      hasBackdrop: true,
    })
    this.matDialogRef.afterClosed().subscribe((result) => {
      if (result === 'video' || result === 'audio') {
        this.activeCalledClient = client;
        //(<HTMLElement>document.querySelector('div#video-container')).style.display = 'block';
        client.startCall(result).then((stream) => {
          (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = stream;
          client.sendMessage(JSON.stringify({type: 'call', mode: result}));
          /* stream.getTracks().forEach((track) => {
            client.getPc().addTrack(track, stream);
          });*/
        }).catch((err) => {
          console.log(err);
          this.handleGetUserMediaErrors(err, client);
        });
      }
    });
    
  }

  private handleGetUserMediaErrors(err: any, client: Client) {
    this.ngZone.run(() => {
      switch(err.name) {
        case 'NotFoundError':
          this.notifier.open('Camera or mic not found', 'OK');
          break;
        
        case 'SecurityError':
          this.notifier.open('Security error occured', 'OK');
          break;

        case 'PermissionDeniedError':
          this.notifier.open('Permission denied', 'OK');
          break;
        
        default:
          this.notifier.open('Error starting call', 'OK');
          break;
      }
    });
  }

  onCallTerminate(): void {
    this.activeCalledClient.sendMessage(JSON.stringify({type: 'call-end'}));
    this.endCurrentCall();
  }

  private endCurrentCall(): void {
    //(<HTMLElement>document.querySelector('div#video-container')).style.display = 'none';
    (<HTMLVideoElement>document.querySelector('div#video-container video')).srcObject = null;
    this.activeCalledClient.endCall();
    this.activeCalledClient = null;
  }
}
