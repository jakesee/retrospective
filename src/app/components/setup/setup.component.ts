import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {

  


  constructor(private _ws:WebsocketService) {

  }

  ngOnInit() {
    
  }

  public join(room:string) {
    this._ws.joinRoom(room);
    console.log("this._ws.joinRoom", room);
    return false;
  }

  public host(room:string) {
    this._ws.hostRoom(room);
    console.log("this._ws.hostRoom", room);
    return false;
  }

}
