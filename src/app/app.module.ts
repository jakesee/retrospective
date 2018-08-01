import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { DragulaModule } from 'ng2-dragula';

import { AppComponent } from './app.component';
import { UserComponent } from './components/user/user.component';

import { DataService } from './services/data.service';
import { AboutComponent } from './components/about/about.component';
import { BoardComponent } from './components/board/board.component';
import { HostComponent } from './components/host/host.component';
import { ChatComponent } from './components/chat/chat.component';
import { SetupComponent } from './components/setup/setup.component'
import { WebsocketService } from './services/websocket.service';


const appRoutes:Routes = [
  { path: '', component:SetupComponent },
  { path: 'about', component:AboutComponent },
  { path: 'board', component:BoardComponent },
  { path: 'chat', component:ChatComponent },
  { path: 'User', component:UserComponent },
]


@NgModule({
  declarations: [ // components
    AppComponent,
    UserComponent,
    AboutComponent,
    BoardComponent,
    HostComponent,
    ChatComponent,
    SetupComponent
  ],
  imports: [ // modules
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    DragulaModule
  ],
  providers: [ // services 
    DataService,
    WebsocketService
  ], 
  bootstrap: [AppComponent] // startup component
})
export class AppModule { }
