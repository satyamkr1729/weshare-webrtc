import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { DetailComponent } from './components/login/detail/detail.component';
import { RoomComponent } from './components/room/room.component';
import { CallModeSelectorComponent } from './components/room/call-mode-selector/call-mode-selector.component';
import { CallAnswerComponent } from './components/room/call-answer/call-answer.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatCardModule} from '@angular/material/card'; 
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { ShareMenuComponent } from './components/share-menu/share-menu.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

const socketConfig: SocketIoConfig = { url: 'https://weshare-webrtc.herokuapp.com/' , options: {secure: true} };

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DetailComponent,
    RoomComponent,
    CallModeSelectorComponent,
    CallAnswerComponent,
    ShareMenuComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatListModule,
    MatSnackBarModule,
    MatSidenavModule,
    SocketIoModule.forRoot(socketConfig),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  entryComponents: [
    DetailComponent,
    CallModeSelectorComponent,
    CallAnswerComponent,
    ShareMenuComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
