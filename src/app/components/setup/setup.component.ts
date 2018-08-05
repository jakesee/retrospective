import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import * as A from '../../models/application.contract';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {

  public isHostVisible = false;
  public availableRooms:[string];

  constructor(private _ws:WebsocketService, private _router:Router) {
    
  }

  ngOnInit() {
    this._ws.getApplicationMessages().subscribe((response) => {
      this._onApplicationMessages(response);
    });
  }

  public showHostTab() {
    this.isHostVisible = true;
  }

  public showJoinTab() {
    this.isHostVisible = false;
  }

  private _onApplicationMessages(response:A.ApplicationResponse) {
    console.log('_onApplicationMessages', response);
  }

  public join(room:string, nickname:string) {
    console.log('join', room.toLowerCase(), nickname);
    this._ws.joinRoom(room, nickname, (response) => {
      console.log(response);
      if(response.result) {
        this._router.navigateByUrl('/room');
      }
    });
    return false;
  }

  public host(room:string, nickname:string) {
    console.log('host', room.toLowerCase(), nickname);
    this._ws.hostRoom(room, nickname, (response) => {
      console.log(response);
      if(response.result) {
        this._router.navigateByUrl('/room');
      }
    });
    return false;
  }
}
