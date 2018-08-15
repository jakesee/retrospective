import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import * as A from '../../models/application.contract';
import * as S from '../../models/server.contract';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  constructor(private _ws:WebsocketService) {

  }

  ngOnInit() {    
    this._ws.getMessages().subscribe((response:S.Response) => {
      this._onResponse(response);
    });
  }

  private _onResponse(response:S.Response) {
    if(response.topic == S.Topic.Join) {
      var param:S.JoinResponseParam = response.param as S.JoinResponseParam;
      console.log(param);
    }
  }

  public getRoom() {
    return this._ws.room;
  }

}
