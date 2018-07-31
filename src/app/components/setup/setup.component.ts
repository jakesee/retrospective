import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {

  public availableRooms:[string];

  constructor(private _ws:WebsocketService) {
    
  }

  ngOnInit() {
    this._ws.getApplicationMessages().subscribe((msg) => {
      this._onApplicationMessages(msg);
    });
  }

  private _onApplicationMessages(msg:any) {
    console.log('_onApplicationMessages', msg);
  }

  public join(room:string) {
    this._ws.joinRoom(room, (msg) => {
      console.log("this._ws.joinRoom", room, msg.response.result);
      this.getRooms();
    });
  }

  public host(room:string) {
    this._ws.hostRoom(room, (msg) => {
      console.log("this._ws.hostRoom", room, msg.response.result);
      this.getRooms();
    });
  }
 
  public getRooms() {
    this._ws.getRooms((msg) => {
      if(msg.response.result) {
        this.availableRooms = msg.response.rooms;
        console.log('component.getRooms', this.availableRooms);
      }
    });
  }
}
