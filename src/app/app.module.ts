import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';

import { DataService } from './services/data.service';
import { AboutComponent } from './components/about/about.component';
import { HostComponent } from './components/host/host.component';
import { RoomComponent } from './components/room/room.component';
import { SetupComponent } from './components/setup/setup.component'
import { WebsocketService } from './services/websocket.service';


const appRoutes:Routes = [
  { path: '', component:SetupComponent },
  { path: 'about', component:AboutComponent },
  { path: 'room', component:RoomComponent },
]


@NgModule({
  declarations: [ // components
    AppComponent,
    AboutComponent,
    HostComponent,
    RoomComponent,
    SetupComponent
  ],
  imports: [ // modules
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [ // services 
    DataService,
    WebsocketService
  ], 
  bootstrap: [AppComponent] // startup component
})
export class AppModule { }
