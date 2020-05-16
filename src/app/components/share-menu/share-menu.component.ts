import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-share-menu',
  templateUrl: './share-menu.component.html',
  styleUrls: ['./share-menu.component.css']
})
export class ShareMenuComponent implements OnInit {

  constructor(public matDialogRef: MatDialogRef<ShareMenuComponent>) { }

  ngOnInit() {
  }

  onShareSelect(ev: Event): void{
    let selecteditem = 
    (<HTMLElement>(ev.currentTarget)).id;
    if (selecteditem)
      this.matDialogRef.close(selecteditem);
  }
}
