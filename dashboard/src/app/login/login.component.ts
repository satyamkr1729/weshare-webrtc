import { Component, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { CreateRoomComponent } from './create-room/create-room.component';
import { DetailComponent } from './detail/detail.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  openCreateRoomDialog(): void {
    const dialogRef = this.dialog.open(DetailComponent, {
      width: '500px',
      hasBackdrop: true,
      panelClass: 'loginDialog',
    });

    dialogRef.afterClosed().subscribe((result) => {

    });
  }

  openJoinRoomDialog(): void {
    const dialogRef = this.dialog.open(DetailComponent, {
      width: '500px',
      hasBackdrop: true,
      panelClass: 'loginDialog'
    });

    dialogRef.afterClosed().subscribe((result) => {

    });
  }
}
