import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketHandlerService {

  constructor(private socket: Socket) { }

  createRoom(userName: string, roomName: string): Promise<any> {
    this.socket.emit('create', {userName, roomName});
    return this.socket.fromOneTimeEvent<any>('created');
  }

  joinRoom(userName: string, roomName: string): Promise<any> {
    this.socket.emit('join', {userName, roomName});
    return this.socket.fromOneTimeEvent<any>('joined');
  }
}
