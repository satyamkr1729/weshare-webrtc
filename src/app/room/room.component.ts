import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketHandlerService } from '../services/socket-handler.service';

interface Client {
  socketId: string;
  userName: string;
  pc: RTCPeerConnection;
}

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

  constructor(private activatedRoute: ActivatedRoute,
    private socketHandler: SocketHandlerService) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe({
      next: (obj) => {
        this.roomName = obj.get('roomid'),
        this.socketId = window.history.state.socketId,
        this.clientList = window.history.state.clientList
      },
      complete: () => console.log('complete')
    });

    this.socketHandler.getClients().subscribe({
      next: (client) => {
        this.clientList.push(client);
      },
    })
  }

  onClientSelect(client: Client): void {
    this.selectedClient = client;
  }

}
