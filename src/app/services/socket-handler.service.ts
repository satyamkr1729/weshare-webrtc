import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketHandlerService {
  message: Observable<any>;
  client: Observable<any>;
  
  constructor(private socket: Socket) { 
    this.message = this.socket.fromEvent<any>('message');
    this.client =  this.socket.fromEvent<any>('client');
  }

  createRoom(userName: string, roomName: string): Promise<any> {
    this.socket.emit('create', {userName, roomName});
    return this.socket.fromOneTimeEvent<any>('created');
  }

  joinRoom(userName: string, roomName: string): Promise<any> {
    this.socket.emit('join', {userName, roomName});
    return this.socket.fromOneTimeEvent<any>('joined');
  }

  getMessage(): Observable<any> {
    return this.message;
  }

  getClients(): Observable<any> {
    return this.client;
  }
}
