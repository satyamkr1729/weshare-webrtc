import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketHandlerService } from '../../services/socket-handler.service';
import { Client } from 'src/app/utils/client';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})

export class RoomComponent implements OnInit {
  socketId: string;
  roomName: string;
  clientList: Client[];
  selectedClient: Client;
  messages: any;

  constructor(private activatedRoute: ActivatedRoute,
    private router: Router,
    private socketHandler: SocketHandlerService) { }
 
  private connectAllClients(): void {
    for(let client of this.clientList) {
      client.connect();
    }
  }

  private initializeSocketMessageListener(): void {
    this.socketHandler.getMessage().subscribe({
      next: (obj) => {
        const client: Client = this.clientList.find((client) => client.getSocketId() === obj.socketId);
        switch(obj.message.type) {
          case 'offer':
            client.handleOffer(obj.message);
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
          this.clientList = window.history.state.clientList.map((client) =>  new Client(this.socketHandler, client.socketId, client.userName));
          this.initializeSocketMessageListener();
          this.connectAllClients();
        }
      },
      complete: () => console.log('complete')
    });

    
  }

  onClientSelect(client: Client): void {
    this.selectedClient = client;
    if (!client.isConnected()) {
      client.connect();
    }
    let chat = JSON.parse(sessionStorage.getItem('weshare'));
    if (chat && chat[client.getSocketId()]) {
      this.messages = chat[client.getSocketId()];
    }
  }

  
}
