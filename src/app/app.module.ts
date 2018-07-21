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
import { StartStopContinueBoardComponent } from './components/start-stop-continue-board/start-stop-continue-board.component';
import { HostComponent } from './components/host/host.component';
import { ChatComponent } from './components/chat/chat.component'


const appRoutes:Routes = [
  { path: '', component:UserComponent },
  { path: 'about', component:AboutComponent },
  { path: 'start-stop-continue-board', component:StartStopContinueBoardComponent },
  { path: 'chat', component:ChatComponent },
]


@NgModule({
  declarations: [ // components
    AppComponent, UserComponent, AboutComponent, StartStopContinueBoardComponent, HostComponent, ChatComponent
  ],
  imports: [ // modules
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    DragulaModule
  ],
  providers: [ // services 
    DataService
  ], 
  bootstrap: [AppComponent] // startup component
})
export class AppModule { }
