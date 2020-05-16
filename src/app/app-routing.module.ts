import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RoomComponent } from './components/room/room.component';


const routes: Routes = [
  {path: '', component: LoginComponent},
  {path: 'room/:roomid', component: RoomComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
