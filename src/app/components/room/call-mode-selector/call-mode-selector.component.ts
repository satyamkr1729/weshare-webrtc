import { Component, OnInit } from '@angular/core';

import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-call-mode-selector',
  templateUrl: './call-mode-selector.component.html',
  styleUrls: ['./call-mode-selector.component.css']
})
export class CallModeSelectorComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CallModeSelectorComponent>) { }

  ngOnInit() {
  }

  action(mode) {
    this.dialogRef.close(mode);
  }
}
