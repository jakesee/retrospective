import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import * as S from '../../models/server.contract';

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
    this._ws.getMessages().subscribe((response) => {
      this._onMessages(response);
    });
  }

  public showHostTab() {
    this.isHostVisible = true;
  }

  public showJoinTab() {
    this.isHostVisible = false;
  }

  private _onMessages(response:S.Response) {
    console.log('_onMessages', response);
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
