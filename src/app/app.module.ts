import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';

import { DataService } from './services/data.service';
import { AboutComponent } from './components/about/about.component';
import { HostComponent } from './components/host/host.component';
import { ChatComponent } from './components/chat/chat.component';
import { SetupComponent } from './components/setup/setup.component'
import { WebsocketService } from './services/websocket.service';


const appRoutes:Routes = [
  { path: '', component:SetupComponent },
  { path: 'about', component:AboutComponent },
  { path: 'chat', component:ChatComponent },
]


@NgModule({
  declarations: [ // components
    AppComponent,
    AboutComponent,
    HostComponent,
    ChatComponent,
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
