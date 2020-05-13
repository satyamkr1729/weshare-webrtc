import { Component, OnInit, Inject, NgZone } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-call-answer',
  templateUrl: './call-answer.component.html',
  styleUrls: ['./call-answer.component.css']
})
export class CallAnswerComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  public dialogRef: MatDialogRef<CallAnswerComponent>,
  private ngZone: NgZone) { }

  ngOnInit() {
  }

  action(mode) {
    this.ngZone.run(() => {
      this.dialogRef.close(mode);
    });
  }

}
