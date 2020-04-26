import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Details } from '../login.component';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})

export class DetailComponent implements OnInit {
  detailsForm = new FormGroup({
    yourName: new FormControl('', Validators.required),
    roomName: new FormControl('', Validators.required),
  });

  constructor(
    public dialogRef: MatDialogRef<DetailComponent>,
  ) { }

  ngOnInit() {
  }

  onSubmit(): void {
    this.dialogRef.close(this.detailsForm.value);
  }
}
