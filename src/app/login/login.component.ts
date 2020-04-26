import { Component, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { DetailComponent } from './detail/detail.component';
import { environment } from 'src/environments/environment';
import { Socket } from 'ngx-socket-io';
import { SocketHandlerService } from '../services/socket-handler.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface Details {
  yourName: string;
  roomName: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  yourName: string;
  roomName: string;

  constructor(private dialog: MatDialog,
    private socketHandler: SocketHandlerService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    console.log(environment.apiUrl);
  }

  openCreateRoomDialog(): void {
    const dialogRef = this.dialog.open(DetailComponent, {
      width: '500px',
      hasBackdrop: true,
      panelClass: 'loginDialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      result.roomName = result.roomName.toLowerCase();
      this.socketHandler.createRoom(result.yourName, result.roomName).then((response) => {
        var message: string = '';
        if (response.success) {
          message = `Successfully created room ${result.roomName}`;
        } else {
          message = `Room name ${result.roomName} already taken`;
        }
        this.snackBar.open(message, 'OK', {
          duration: 3000,
        });
      });
    });
  }

  openJoinRoomDialog(): void {
    const dialogRef = this.dialog.open(DetailComponent, {
      width: '500px',
      hasBackdrop: true,
      panelClass: 'loginDialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      result.roomName = result.roomName.toLowerCase();
      this.socketHandler.joinRoom(result.yourName, result.roomName).then((response) => {
        var message: string = '';
        if (response.success) {
          message = `Successfully joined room ${result.roomName}`;
        } else {
          message = `Room ${result.roomName} does not exist`;
        }
        this.snackBar.open(message, 'OK', {
          duration: 3000,
        });
      });
    });
  }
}
